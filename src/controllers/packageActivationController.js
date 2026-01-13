const PackageActivation = require("../models/packageActivation");
const User = require("../models/user");
const Package = require("../models/referral_packages");
const Financial = require("../models/financial");
const Milestone = require("../models/milestone");
const imagekit = require("../config/imagekit");
const { searchInColumns, getQuery } = require("../utils");


// ✅ FIXED: Submit current package activation
const submitCurrentPackageActivation = async (req, res) => {
  try {
    console.log('🔵 Current Package Activation Request Received');
    console.log('Body:', req.body);
    console.log('File:', req.file ? 'File received' : 'No file');

    const { user_id, transaction_id, amount, package_id } = req.body;
    
    // ✅ Get user ID from multiple sources
    let userId = user_id || req.body.user;
    
    // If using JWT authentication
    if (!userId && req.user && req.user.id) {
      userId = req.user.id;
    }

    console.log('🆔 User ID:', userId);

    // ✅ Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required. Please provide user_id in request body"
      });
    }

    if (!transaction_id) {
      return res.status(400).json({
        success: false,
        error: "Transaction ID is required"
      });
    }

    if (!amount) {
      return res.status(400).json({
        success: false,
        error: "Amount is required"
      });
    }

    if (!package_id) {
      return res.status(400).json({
        success: false,
        error: "Package ID is required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Payment screenshot is required"
      });
    }

    // ✅ Find user
    console.log('🔍 Finding user with ID:', userId);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found with ID: " + userId
      });
    }
    console.log('✅ User found:', user.firstname, user.lastname);

    // ✅ FIXED: Use Package instead of ReferralPackage
    console.log('🔍 Finding package with ID:', package_id);
    const package = await Package.findById(package_id);
    if (!package) {
      return res.status(404).json({
        success: false,
        error: "Package not found with ID: " + package_id
      });
    }
    console.log('✅ Package found:', package.title);

    // ✅ Check if user already has this package
    if (user.referral_package && user.referral_package.toString() !== package_id) {
      return res.status(400).json({
        success: false,
        error: `User already has a different package assigned. Current: ${user.referral_package}, Requested: ${package_id}`
      });
    }

    // ✅ Check for existing pending request
    const existingRequest = await PackageActivation.findOne({
      user: userId,
      requested_package: package_id,
      status: 'pending',
      is_current_package: true
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: "You already have a pending activation request for this package"
      });
    }

    // ✅ Upload payment screenshot
    console.log('📤 Uploading payment screenshot...');
    let paymentImage;
    try {
      // Check if uploadToCloudinary function exists
      if (typeof uploadToCloudinary === 'function') {
        paymentImage = await uploadToCloudinary(req.file, 'payment-screenshots');
      } else if (imagekit && typeof imagekit.upload === 'function') {
        // If using ImageKit instead
        const uploadResponse = await imagekit.upload({
          file: req.file.buffer,
          fileName: `payment-${Date.now()}.jpg`,
          folder: '/payment-screenshots',
        });
        paymentImage = {
          secure_url: uploadResponse.url,
          public_id: uploadResponse.fileId
        };
      } else {
        // Simple file save if no upload service
        const fileName = `payment-${Date.now()}-${req.file.originalname}`;
        const fs = require('fs');
        const path = require('path');
        const uploadPath = path.join(__dirname, '../uploads/payments', fileName);
        
        // Create directory if it doesn't exist
        const dirPath = path.dirname(uploadPath);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        
        fs.writeFileSync(uploadPath, req.file.buffer);
        paymentImage = {
          secure_url: `/uploads/payments/${fileName}`,
          public_id: fileName
        };
      }
      
      if (!paymentImage || !paymentImage.secure_url) {
        throw new Error('Payment upload failed');
      }
      console.log('✅ Payment screenshot uploaded:', paymentImage.secure_url);
    } catch (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return res.status(500).json({
        success: false,
        error: "Failed to upload payment screenshot: " + uploadError.message
      });
    }

    // ✅ Create activation request
    const activationRequest = new PackageActivation({
      user: userId,
      type: 'activation',
      current_package: user.referral_package || null,
      requested_package: package_id,
      transaction_id: transaction_id.trim(),
      amount: parseFloat(amount),
      paymentScreenshotURL: paymentImage.secure_url,
      paymentScreenshotId: paymentImage.public_id,
      status: 'pending',
      is_first_time: !user.referral_package,
      is_current_package: true,
      remarks: `Current package activation for ${package.title}`
    });

    await activationRequest.save();
    console.log('✅ Activation request saved:', activationRequest._id);

    // ✅ Update user if no package assigned
    if (!user.referral_package) {
      user.referral_package = package_id;
      user.referral_payment_status = false;
      user.has_pending_request = true;
      await user.save();
      console.log('✅ User package updated');
    }

    // ✅ Prepare response
    const responseData = {
      id: activationRequest._id,
      user: {
        id: user._id,
        name: user.firstname + ' ' + user.lastname,
        email: user.email,
        phone: user.phone
      },
      package: {
        id: package._id,
        title: package.title,
        price: package.price,
        commission_rate: package.commission_rate
      },
      transaction_id: activationRequest.transaction_id,
      amount: activationRequest.amount,
      status: activationRequest.status,
      payment_proof: activationRequest.paymentScreenshotURL,
      is_current_package: true,
      created_at: activationRequest.createdAt,
      message: "Activation request submitted successfully. Admin will review your payment."
    };

    console.log('✅ Activation completed successfully');

    res.status(201).json({
      success: true,
      message: "Current package activation request submitted successfully",
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error in submitCurrentPackageActivation:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: "Server error: " + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ✅ FIXED: Regular activation request
const submitActivationRequest = async (req, res) => {
  try {
    const { package_id, transaction_id, amount, user_id } = req.body;
    
    // Get user from JWT or body
    let userId = req.user?.id || user_id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      });
    }

    if (!package_id || !transaction_id || !amount) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: package_id, transaction_id, amount"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Payment screenshot is required"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // ✅ FIXED: Use Package instead of ReferralPackage
    const package = await Package.findById(package_id);
    if (!package) {
      return res.status(404).json({
        success: false,
        error: "Package not found"
      });
    }

    // Check if user already has a pending request
    const existingRequest = await PackageActivation.findOne({
      user: userId,
      requested_package: package_id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: "You already have a pending activation request"
      });
    }

    // Upload payment screenshot
    let paymentImage;
    try {
      if (typeof uploadToCloudinary === 'function') {
        paymentImage = await uploadToCloudinary(req.file, 'payment-screenshots');
      } else if (imagekit && typeof imagekit.upload === 'function') {
        const uploadResponse = await imagekit.upload({
          file: req.file.buffer,
          fileName: `payment-${Date.now()}.jpg`,
          folder: '/payment-screenshots',
        });
        paymentImage = {
          secure_url: uploadResponse.url,
          public_id: uploadResponse.fileId
        };
      }
      
      if (!paymentImage) {
        return res.status(500).json({
          success: false,
          error: "Failed to upload payment screenshot"
        });
      }
    } catch (uploadError) {
      return res.status(500).json({
        success: false,
        error: "Upload error: " + uploadError.message
      });
    }

    const activationRequest = new PackageActivation({
      user: userId,
      type: 'activation',
      current_package: user.referral_package,
      requested_package: package_id,
      transaction_id,
      amount: parseFloat(amount),
      paymentScreenshotURL: paymentImage.secure_url,
      paymentScreenshotId: paymentImage.public_id,
      status: 'pending',
      is_first_time: !user.referral_package,
      is_current_package: false
    });

    await activationRequest.save();

    // Update user's pending request status
    user.has_pending_request = true;
    await user.save();

    res.status(201).json({
      success: true,
      message: "Activation request submitted successfully",
      data: activationRequest
    });

  } catch (error) {
    console.error('Error in submitActivationRequest:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error occurred"
    });
  }
};

// Get all activation requests (Admin)
const getAllActivationRequests = async (req, res) => {
  try {
    let { page, limit, search, status, type, ...queries } = req.query;
    
    // Build search query
    search = searchInColumns(search, ["transaction_id"]);
    
    // Build filter query
    let filterQuery = {};
    
    if (search && search.length > 0) {
      filterQuery.$or = search;
    }
    
    if (status) {
      filterQuery.status = status;
    }
    
    if (type) {
      filterQuery.type = type;
    }
    
    // Add other filters
    const additionalQueries = getQuery(queries);
    filterQuery = { ...filterQuery, ...additionalQueries };

    // Create aggregate pipeline
    const aggregate = PackageActivation.aggregate([
      { $match: filterQuery },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $lookup: {
          from: "referral_packages", // ✅ Use correct collection name
          localField: "requested_package",
          foreignField: "_id",
          as: "packageDetails"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "processed_by",
          foreignField: "_id",
          as: "processedByDetails"
        }
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$packageDetails", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$processedByDetails", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          user: "$userDetails",
          requested_package: "$packageDetails",
          processed_by: "$processedByDetails"
        }
      },
      {
        $project: {
          userDetails: 0,
          packageDetails: 0,
          processedByDetails: 0,
          paymentScreenshotId: 0
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      customLabels: {
        docs: 'data',
        totalDocs: 'total'
      }
    };

    const result = await PackageActivation.aggregatePaginate(aggregate, options);

    res.status(200).json({
      success: true,
      message: "Activation requests fetched successfully",
      data: result
    });

  } catch (err) {
    console.error("Get activation requests error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get activation requests for specific user
const getUserActivationRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const requests = await PackageActivation.find({ user: userId })
      .populate("requested_package", "title price commission")
      .populate("processed_by", "firstname lastname")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "User activation requests fetched successfully",
      data: requests
    });

  } catch (err) {
    console.error("Get user activation requests error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Process activation request (Approve/Reject)
const processActivationRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, remarks, processed_by } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Invalid action. Use 'approve' or 'reject'"
      });
    }

    const request = await PackageActivation.findById(requestId)
      .populate("user")
      .populate("requested_package");

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Activation request not found"
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: `Request is already ${request.status}`
      });
    }

    const processedByUser = await User.findById(processed_by);
    if (!processedByUser) {
      return res.status(404).json({
        success: false,
        error: "Admin user not found"
      });
    }

    if (action === "approve") {
      // Update user's package and payment status
      await User.findByIdAndUpdate(request.user._id, {
        referral_package: request.requested_package._id,
        referral_payment_status: true,
        transaction_id: request.transaction_id,
        commission: request.requested_package.commission,
        paymentScreenshotURL: request.paymentScreenshotURL,
        paymentScreenshotId: request.paymentScreenshotId,
        has_pending_request: false,
        updatedAt: new Date()
      });

     
        await handleActivationCommission(request.user, request.requested_package, request.amount);
      

      // Update request status
      request.status = "approved";
      request.remarks = remarks || "Activation approved successfully";
      request.processed_by = processed_by;
      await request.save();

      res.status(200).json({
        success: true,
        message: "Activation request approved successfully",
        data: request
      });

    } else if (action === "reject") {
      // Update request status to rejected
      request.status = "rejected";
      request.remarks = remarks || "Activation rejected";
      request.processed_by = processed_by;
      
      // Update user to remove pending request flag
      await User.findByIdAndUpdate(request.user._id, {
        has_pending_request: false
      });
      
      await request.save();

      res.status(200).json({
        success: true,
        message: "Activation request rejected",
        data: request
      });
    }

  } catch (err) {
    console.error("Process activation request error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Helper function: Handle activation commission
const handleActivationCommission = async (user, package, amount) => {
  try {
    const milestones = await Milestone.findOne();
    if (!milestones) return;

    let ref1Commission = 0, ref2Commission = 0, ref3Commission = 0;

    // Level 1 commission
    if (user.referred_by) {
      const ref1 = await User.findOne({ user_code: user.referred_by });
      if (ref1) {
        ref1Commission = amount * (milestones.levelOne / 100);
        
        await Financial.create({
          user: ref1._id,
          package: package._id,
          amount: ref1Commission,
          type: "ACTIVATION",
          description: `Commission from ${user.firstname} ${user.lastname}'s package activation`,
          createdAt: new Date()
        });

        // Level 2 commission
        if (ref1.referred_by) {
          const ref2 = await User.findOne({ user_code: ref1.referred_by });
          if (ref2) {
            ref2Commission = amount * (milestones.levelTwo / 100);
            
            await Financial.create({
              user: ref2._id,
              package: package._id,
              amount: ref2Commission,
              type: "ACTIVATION",
              description: `Level 2 commission from activation`,
              createdAt: new Date()
            });

            // Level 3 commission
            if (ref2.referred_by) {
              const ref3 = await User.findOne({ user_code: ref2.referred_by });
              if (ref3) {
                ref3Commission = amount * (milestones.levelThree / 100);
                
                await Financial.create({
                  user: ref3._id,
                  package: package._id,
                  amount: ref3Commission,
                  type: "ACTIVATION",
                  description: `Level 3 commission from activation`,
                  createdAt: new Date()
                });
              }
            }
          }
        }
      }
    }

    // Admin commission
    const adminCommission = amount - ref1Commission - ref2Commission - ref3Commission;
    if (adminCommission > 0) {
      await Financial.create({
        darsi: true,
        package: package._id,
        amount: adminCommission,
        type: "ACTIVATION",
        description: `Admin commission from ${user.firstname} ${user.lastname}'s package activation`,
        createdAt: new Date()
      });
    }

  } catch (err) {
    console.error("Activation commission calculation error:", err);
  }
};

// Get activation request by ID
const getActivationRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await PackageActivation.findById(requestId)
      .populate("user", "firstname lastname email user_code referred_by")
      .populate("requested_package", "title price commission discount_percentage")
      .populate("processed_by", "firstname lastname");

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Activation request not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Activation request fetched successfully",
      data: request
    });

  } catch (err) {
    console.error("Get activation request by ID error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get combined requests history for user (activations + upgrades)
const getCombinedRequestsHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get activations
    const activations = await PackageActivation.find({ user: userId })
      .populate("requested_package", "title price")
      .populate("processed_by", "firstname lastname")
      .sort({ createdAt: -1 });

    // Get upgrades
    const PackageUpgradeRequest = require("../models/packageUpgradeRequest");
    const upgrades = await PackageUpgradeRequest.find({ user: userId })
      .populate("current_package", "title price")
      .populate("requested_package", "title price")
      .populate("processed_by", "firstname lastname")
      .sort({ createdAt: -1 });

    // Combine and sort by date
    const combinedRequests = [
      ...activations.map(a => ({ ...a.toObject(), request_type: 'activation' })),
      ...upgrades.map(u => ({ ...u.toObject(), request_type: 'upgrade' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      message: "Combined requests history fetched successfully",
      data: combinedRequests
    });

  } catch (err) {
    console.error("Get combined requests history error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Check user activation status
const checkUserActivationStatus = async (req, res) => {
  try {
    const user_id = req.user?._id; // From JWT middleware
    
    const user = await User.findById(user_id)
      .populate("referral_package", "title price commission");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Check for pending requests
    const pendingActivation = await PackageActivation.findOne({
      user: user_id,
      status: "pending"
    });

    const PackageUpgradeRequest = require("../models/packageUpgradeRequest");
    const pendingUpgrade = await PackageUpgradeRequest.findOne({
      user: user_id,
      status: "pending"
    });

    res.status(200).json({
      success: true,
      message: "User activation status fetched successfully",
      data: {
        user: {
          _id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          user_code: user.user_code,
          role: user.role,
          referred_by: user.referred_by
        },
        package_info: {
          has_package: !!user.referral_package,
          current_package: user.referral_package,
          is_active: user.referral_payment_status === true,
          payment_status: user.referral_payment_status,
          transaction_id: user.transaction_id
        },
        pending_requests: {
          activation: pendingActivation ? {
            _id: pendingActivation._id,
            status: pendingActivation.status,
            created_at: pendingActivation.createdAt
          } : null,
          upgrade: pendingUpgrade ? {
            _id: pendingUpgrade._id,
            status: pendingUpgrade.status,
            created_at: pendingUpgrade.createdAt
          } : null,
          has_pending: !!(pendingActivation || pendingUpgrade)
        },
        needs_activation: !!user.referral_package && !user.referral_payment_status
      }
    });

  } catch (err) {
    console.error("Check user activation status error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = {
  submitActivationRequest,
  submitCurrentPackageActivation,
  getAllActivationRequests,
  getUserActivationRequests,
  processActivationRequest,
  getActivationRequestById,
  getCombinedRequestsHistory,
  checkUserActivationStatus
};