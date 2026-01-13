// controllers/packageUpgradeController.js
const PackageUpgradeRequest = require("../models/packageUpgradeRequest");
const User = require("../models/user");
const Package = require("../models/referral_packages");
const Financial = require("../models/financial");
const Milestone = require("../models/milestone");
const imagekit = require("../config/imagekit");
const { searchInColumns, getQuery } = require("../utils");

// Submit upgrade request
const submitUpgradeRequest = async (req, res) => {
  try {
    const {
      user,
      current_package,
      requested_package,
      transaction_id,
      amount,
    } = req.body;

    const paymentScreenshot = req.file;

    // Validate required fields
    if (!user || !requested_package || !transaction_id || !amount) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: user, requested_package, transaction_id, amount"
      });
    }

    // Validate user
    const userExists = await User.findById(user);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Check if user already has a pending request
    const existingPendingRequest = await PackageUpgradeRequest.findOne({
      user: user,
      status: "pending"
    });

    if (existingPendingRequest) {
      return res.status(400).json({
        success: false,
        error: "You already have a pending upgrade request. Please wait for admin approval.",
        data: existingPendingRequest
      });
    }

    // Validate requested package
    const requestedPackageExists = await Package.findById(requested_package);
    if (!requestedPackageExists) {
      return res.status(404).json({
        success: false,
        error: "Requested package not found"
      });
    }

    // Handle payment screenshot upload
    let paymentScreenshotURL = null;
    let paymentScreenshotId = null;

    if (paymentScreenshot) {
      const uploadedFile = await imagekit.upload({
        file: paymentScreenshot.buffer,
        fileName: `upgrade_${Date.now()}_${paymentScreenshot.originalname}`,
        folder: "/upgrade-payments",
        useUniqueFileName: true
      });
      
      paymentScreenshotURL = uploadedFile.url;
      paymentScreenshotId = uploadedFile.fileId;
    } else {
      return res.status(400).json({
        success: false,
        error: "Payment screenshot is required"
      });
    }

    // Get latest approved request as parent
    const latestApprovedRequest = await PackageUpgradeRequest.findOne({
      user: user,
      status: "approved"
    }).sort({ createdAt: -1 });

    // Get all previous requests for history
    const previousRequests = await PackageUpgradeRequest.find({
      user: user
    }).sort({ createdAt: 1 });

    // Create new upgrade request
    const upgradeRequest = await PackageUpgradeRequest.create({
      user: user,
      current_package: current_package || userExists.referral_package,
      requested_package: requested_package,
      transaction_id: transaction_id,
      amount: amount,
      paymentScreenshotURL: paymentScreenshotURL,
      paymentScreenshotId: paymentScreenshotId,
      status: "pending",
      parent_request: latestApprovedRequest?._id || null,
      previous_requests: previousRequests.map(req => req._id)
    });

    // Populate response data
    const populatedRequest = await PackageUpgradeRequest.findById(upgradeRequest._id)
      .populate("user", "firstname lastname email user_code")
      .populate("current_package", "title price")
      .populate("requested_package", "title price commission");

    res.status(201).json({
      success: true,
      message: "Upgrade request submitted successfully",
      data: populatedRequest
    });

  } catch (err) {
    console.error("Submit upgrade request error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get all upgrade requests (with pagination and filters)
const getAllUpgradeRequests = async (req, res) => {
  try {
    let { page, limit, search, status, ...queries } = req.query;
    
    // Parse pagination parameters
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;
    
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
    
    // Add other filters
    const additionalQueries = getQuery(queries);
    filterQuery = { ...filterQuery, ...additionalQueries };

    // Create aggregate pipeline
    const aggregatePipeline = [];
    
    if (Object.keys(filterQuery).length > 0) {
      aggregatePipeline.push({ $match: filterQuery });
    }
    
    // Lookup user details
    aggregatePipeline.push({
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDetails"
      }
    });
    
    // Lookup current package
    aggregatePipeline.push({
      $lookup: {
        from: "referral_packages",
        localField: "current_package",
        foreignField: "_id",
        as: "currentPackageDetails"
      }
    });
    
    // Lookup requested package
    aggregatePipeline.push({
      $lookup: {
        from: "referral_packages",
        localField: "requested_package",
        foreignField: "_id",
        as: "requestedPackageDetails"
      }
    });
    
    // Lookup processed by
    aggregatePipeline.push({
      $lookup: {
        from: "users",
        localField: "processed_by",
        foreignField: "_id",
        as: "processedByDetails"
      }
    });
    
    // Unwind arrays
    aggregatePipeline.push(
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$currentPackageDetails", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$requestedPackageDetails", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$processedByDetails", preserveNullAndEmptyArrays: true } }
    );
    
    // Add calculated fields
    aggregatePipeline.push({
      $addFields: {
        user: "$userDetails",
        current_package: "$currentPackageDetails",
        requested_package: "$requestedPackageDetails",
        processed_by: "$processedByDetails"
      }
    });
    
    // Remove unnecessary fields
    aggregatePipeline.push({
      $project: {
        userDetails: 0,
        currentPackageDetails: 0,
        requestedPackageDetails: 0,
        processedByDetails: 0,
        paymentScreenshotId: 0,
        previous_requests: 0
      }
    });
    
    // Get total count
    const countPipeline = [...aggregatePipeline];
    countPipeline.push({ $count: "total" });
    const countResult = await PackageUpgradeRequest.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;
    
    // Add pagination and sorting
    aggregatePipeline.push({ $sort: { createdAt: -1 } });
    aggregatePipeline.push({ $skip: skip });
    aggregatePipeline.push({ $limit: limit });
    
    // Execute aggregation
    const data = await PackageUpgradeRequest.aggregate(aggregatePipeline);

    res.status(200).json({
      success: true,
      message: "Upgrade requests fetched successfully",
      data: {
        docs: data,
        totalDocs: total,
        limit: limit,
        page: page,
        totalPages: Math.ceil(total / limit),
        pagingCounter: skip + 1,
        hasPrevPage: page > 1,
        hasNextPage: (page * limit) < total,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: (page * limit) < total ? page + 1 : null
      }
    });

  } catch (err) {
    console.error("Get upgrade requests error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// 或者，如果您想使用插件，这里是如何使用 aggregatePaginate 的正确方法：
const getAllUpgradeRequestsWithPlugin = async (req, res) => {
  try {
    let { page, limit, search, status, ...queries } = req.query;
    
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
    
    // Add other filters
    const additionalQueries = getQuery(queries);
    filterQuery = { ...filterQuery, ...additionalQueries };

    // Create aggregate pipeline
    const aggregate = PackageUpgradeRequest.aggregate([
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
          from: "referral_packages",
          localField: "current_package",
          foreignField: "_id",
          as: "currentPackageDetails"
        }
      },
      {
        $lookup: {
          from: "referral_packages",
          localField: "requested_package",
          foreignField: "_id",
          as: "requestedPackageDetails"
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
      { $unwind: { path: "$currentPackageDetails", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$requestedPackageDetails", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$processedByDetails", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          user: "$userDetails",
          current_package: "$currentPackageDetails",
          requested_package: "$requestedPackageDetails",
          processed_by: "$processedByDetails"
        }
      },
      {
        $project: {
          userDetails: 0,
          currentPackageDetails: 0,
          requestedPackageDetails: 0,
          processedByDetails: 0,
          paymentScreenshotId: 0,
          previous_requests: 0
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

    const result = await PackageUpgradeRequest.aggregatePaginate(aggregate, options);

    res.status(200).json({
      success: true,
      message: "Upgrade requests fetched successfully",
      data: result
    });

  } catch (err) {
    console.error("Get upgrade requests error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get upgrade requests for specific user
const getUserUpgradeRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const requests = await PackageUpgradeRequest.find({ user: userId })
      .populate("current_package", "title price")
      .populate("requested_package", "title price commission")
      .populate("processed_by", "firstname lastname")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "User upgrade requests fetched successfully",
      data: requests
    });

  } catch (err) {
    console.error("Get user upgrade requests error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Process upgrade request (Approve/Reject)
const processUpgradeRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, remarks, processed_by } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Invalid action. Use 'approve' or 'reject'"
      });
    }

    const request = await PackageUpgradeRequest.findById(requestId)
      .populate("user")
      .populate("requested_package")
      .populate("current_package");

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Upgrade request not found"
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
      // Update user's package
      await User.findByIdAndUpdate(request.user._id, {
        referral_package: request.requested_package._id,
        referral_payment_status: true,
        transaction_id: request.transaction_id,
        commission: request.requested_package.commission,
        paymentScreenshotURL: request.paymentScreenshotURL,
        paymentScreenshotId: request.paymentScreenshotId,
        updatedAt: new Date()
      });

      // Calculate price difference for commission
      const currentPrice = request.current_package?.price || 0;
      const newPrice = request.requested_package.price;
      const priceDifference = newPrice - currentPrice;

      // Handle commission for upgrade difference
      if (priceDifference > 0 && request.user.referred_by) {
        await handleUpgradeCommission(request.user, request.requested_package, priceDifference);
      }

      // Update request status
      request.status = "approved";
      request.remarks = remarks || "Request approved successfully";
      request.processed_by = processed_by;
      await request.save();

      res.status(200).json({
        success: true,
        message: "Upgrade request approved successfully",
        data: request
      });

    } else if (action === "reject") {
      // Update request status to rejected
      request.status = "rejected";
      request.remarks = remarks || "Request rejected";
      request.processed_by = processed_by;
      await request.save();

      res.status(200).json({
        success: true,
        message: "Upgrade request rejected",
        data: request
      });
    }

  } catch (err) {
    console.error("Process upgrade request error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Helper function: Handle upgrade commission
const handleUpgradeCommission = async (user, newPackage, priceDifference) => {
  try {
    const milestones = await Milestone.findOne();
    if (!milestones) return;

    let ref1Commission = 0, ref2Commission = 0, ref3Commission = 0;

    // Level 1 commission
    if (user.referred_by) {
      const ref1 = await User.findOne({ user_code: user.referred_by });
      if (ref1) {
        ref1Commission = priceDifference * (milestones.levelOne / 100);
        
        await Financial.create({
          user: ref1._id,
          package: newPackage._id,
          amount: ref1Commission,
          type: "UPGRADE",
          description: `Commission from ${user.firstname} ${user.lastname}'s package upgrade`,
          createdAt: new Date()
        });

        // Level 2 commission
        if (ref1.referred_by) {
          const ref2 = await User.findOne({ user_code: ref1.referred_by });
          if (ref2) {
            ref2Commission = priceDifference * (milestones.levelTwo / 100);
            
            await Financial.create({
              user: ref2._id,
              package: newPackage._id,
              amount: ref2Commission,
              type: "UPGRADE",
              description: `Level 2 commission from upgrade`,
              createdAt: new Date()
            });

            // Level 3 commission
            if (ref2.referred_by) {
              const ref3 = await User.findOne({ user_code: ref2.referred_by });
              if (ref3) {
                ref3Commission = priceDifference * (milestones.levelThree / 100);
                
                await Financial.create({
                  user: ref3._id,
                  package: newPackage._id,
                  amount: ref3Commission,
                  type: "UPGRADE",
                  description: `Level 3 commission from upgrade`,
                  createdAt: new Date()
                });
              }
            }
          }
        }
      }
    }

    // Admin commission
    const adminCommission = priceDifference - ref1Commission - ref2Commission - ref3Commission;
    if (adminCommission > 0) {
      await Financial.create({
        darsi: true,
        package: newPackage._id,
        amount: adminCommission,
        type: "UPGRADE",
        description: `Admin commission from ${user.firstname} ${user.lastname}'s package upgrade`,
        createdAt: new Date()
      });
    }

  } catch (err) {
    console.error("Commission calculation error:", err);
  }
};

// Get request by ID
const getUpgradeRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await PackageUpgradeRequest.findById(requestId)
      .populate("user", "firstname lastname email user_code referred_by")
      .populate("current_package", "title price commission")
      .populate("requested_package", "title price commission discount_percentage")
      .populate("processed_by", "firstname lastname")
      .populate("parent_request")
      .populate("previous_requests");

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Upgrade request not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Upgrade request fetched successfully",
      data: request
    });

  } catch (err) {
    console.error("Get upgrade request by ID error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get upgrade history with hierarchy
const getUpgradeHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const requests = await PackageUpgradeRequest.find({ user: userId })
      .populate("current_package", "title price")
      .populate("requested_package", "title price")
      .populate("processed_by", "firstname lastname")
      .sort({ createdAt: 1 });

    // Build hierarchical structure
    const history = [];
    const requestMap = new Map();

    // Create map of all requests
    requests.forEach(request => {
      requestMap.set(request._id.toString(), {
        ...request.toObject(),
        children: []
      });
    });

    // Build parent-child relationships
    requests.forEach(request => {
      if (request.parent_request) {
        const parent = requestMap.get(request.parent_request.toString());
        if (parent) {
          parent.children.push(requestMap.get(request._id.toString()));
        }
      } else {
        history.push(requestMap.get(request._id.toString()));
      }
    });

    res.status(200).json({
      success: true,
      message: "Upgrade history fetched successfully",
      data: history
    });

  } catch (err) {
    console.error("Get upgrade history error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = {
  submitUpgradeRequest,
  getAllUpgradeRequests, // 或者使用 getAllUpgradeRequestsWithPlugin 如果您安装了插件
  getUserUpgradeRequests,
  processUpgradeRequest,
  getUpgradeRequestById,
  getUpgradeHistory
};