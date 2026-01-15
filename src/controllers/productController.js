const Product = require("../models/product");
const User = require("../models/user");
const { faker } = require("@faker-js/faker");
const imagekit = require("../config/imagekit");
const { searchInColumns, getQuery } = require("../utils");
const send_email = require("../middleware/email");
const mongoose = require("mongoose");


const excel = require("exceljs");

const fs = require("fs");
const path = require("path");




const getAllProducts = async (req, res) => {
  try {
    let { page, limit, search, sort, subject, ...queries } = req.query;
    let searchText = search;

    // Subject_name search included in search bar
    search = searchInColumns(search, [
      "category_name",
      "brand_name",
      "title",
      "description",
      "subject_name", // ✅ search by subject name
      "isbn",
      "productCode",
    ]);

    // Convert other filters to mongoose query
    queries = getQuery(queries);

    // ✅ Add subject filter like brand
 if (subject && subject.trim() !== "") {
  queries.subject = mongoose.Types.ObjectId(subject);
}


    // Build aggregation
    let myAggregate;
    if (!search) {
      myAggregate = Product.aggregate([
        { $match: { $and: [queries] } },
        { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "categories" } },
        { $lookup: { from: "users", localField: "vendor", foreignField: "_id", as: "vendors" } },
        { $lookup: { from: "brands", localField: "brand", foreignField: "_id", as: "brands" } },
        { $lookup: { from: "subjects", localField: "subject", foreignField: "_id", as: "subjects" } },
      ]);
    } else {
      myAggregate = Product.aggregate([
        {
          $match: {
            $and: [
              { $or: [...search, { isbn: new RegExp(searchText, "i") }] },
              queries,
            ],
          },
        },
        { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "categories" } },
        { $lookup: { from: "users", localField: "vendor", foreignField: "_id", as: "vendors" } },
        { $lookup: { from: "brands", localField: "brand", foreignField: "_id", as: "brands" } },
        { $lookup: { from: "subjects", localField: "subject", foreignField: "_id", as: "subjects" } },
      ]);
    }

    // Sorting
    let sortOption = {};
    switch (sort) {
      case "PRICE_HIGH_TO_LOW":
        sortOption = { price: -1 };
        break;
      case "PRICE_LOW_TO_HIGH":
        sortOption = { price: 1 };
        break;
      case "RECENT":
      default:
        sortOption = { createdAt: -1 };
    }

    // Pagination options
    const options = {
      page: Number(page) || 1,
      limit: Number(limit) || 24,
      sort: sortOption,
    };

    const data = await Product.aggregatePaginate(myAggregate, options);

    return res.status(200).json({
      message: "Successfully fetched products",
      data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || err });
  }
};













const suggestProducts = async (req, res) => {
  try {
    let { page, limit = 12, search, sort, targetAge, ...queries } = req.query;
    search = searchInColumns(search, [
      "category_name",
      "brand_name",
      "title",
      "description",
      "subject_name",
      "isbn",
    ]);
    queries = getQuery(queries);
    let myAggregate;
    if (!search) {
      myAggregate = Product.aggregate([
        { $match: { targetAge: +targetAge } },
        { $sample: { size: +limit } },
        // {
        //   $lookup: {
        //     from: "categories",
        //     localField: "category",
        //     foreignField: "_id",
        //     as: "categories",
        //   },
        // },
        // {
        //   $lookup: {
        //     from: "users",
        //     localField: "vendor",
        //     foreignField: "_id",
        //     as: "vendors",
        //   },
        // },
        // {
        //   $lookup: {
        //     from: "brands",
        //     localField: "brand",
        //     foreignField: "_id",
        //     as: "brands",
        //   },
        // },
      ]);
    } else {
      myAggregate = Product.aggregate([
        { $match: { $and: [{ $or: search }, queries] } },
        { $sample: { size: +limit } },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categories",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "vendor",
            foreignField: "_id",
            as: "vendors",
          },
        },
        {
          $lookup: {
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brands",
          },
        },
      ]);
    }
    let sortOption = {};
    if (sort) {
      switch (sort) {
        case "PRICE_HIGH_TO_LOW":
          sortOption = { price: -1 };
          break;
        case "PRICE_LOW_TO_HIGH":
          sortOption = { price: 1 };
          break;
        case "RECENT":
          sortOption = { createdAt: -1 };
          break;
      }
    } else {
      sortOption = { createdAt: -1 };
    }
    const options = {
      page: page || 1,
      limit: limit || 24,
      sort: sortOption,
    };

    const data = await Product.aggregatePaginate(myAggregate, options);

    return res.status(200).send({
      message: "Successfully fetch products",
      change: "Changes applied for testing123",
      data: data,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
};
const getAllProductWithoutFilter = async (req, res) => {
  try {
    const data = await Product.find(req.query);
    return res.json(data);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const addProduct = async (req, res) => {
  try {
    const {
      title,
      category,
      brand,
      subject,
      vendor,
      vendorPrice,
      price,
      available,
      isActive,
      isFeatured,
      stockCountPending,
      description,
      tags,
      targetAge,
      media,
      options,
      vendor_name,
      brand_name,
      subject_name,
      category_name,
      isbn,
    } = req.body;
    let data = await Product.create({
      title,
      category,
      brand,
      subject,
      vendorPrice,
      vendor,
      price,
      available,
      isActive,
      isFeatured,
      stockCountPending,
      description,
      tags,
      targetAge,
      productCode: faker.phone.number("###-###"),
      createdBy: req.userId,
      profitMargin: price - vendorPrice,
      media,
      options,
      vendor_name,
      brand_name,
      category_name,
      subject_name,
      isbn,
    });

    // if (file && data._id) {
    //   let img = await imagekit.upload({
    //     file: file.buffer, //required
    //     fileName: file.originalname, //required
    //     folder: "/Products",
    //   });
    //   data = await Product.findByIdAndUpdate(data.id, {
    //     imageURL: img.url,
    //     imageId: img.fileId,
    //   });
    // }

    // if(files.length > 0 && data._id){
    //   media = files.map(async(med) => {
    //     let img = await imagekit.upload({
    //       file: med.buffer, //required
    //       fileName: med.originalname, //required
    //       folder: "/Products",
    //     });
    //     return {
    //       imageUrl: img.url,
    //       imageId: img.fileId,
    //       isFront: med.isFront
    //     }
    //   })
    //   data = await Product.findByIdAndUpdate(data.id, {
    //     media: media
    //   });
    // }

    res.status(200).json({
      message: "Your product has been Added Successfully.",
      data: data,
    });
  } catch (err) {
    res.status(500).json({
      errorMsg: "An error ocurred during submitting this product .",
      error: err,
    });
  }
};
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send({ error: "Product not found" });
    return res.json(product);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Product has been deleted..." });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const updateProduct = async (req, res) => {
  try {
    const {
      title,
      category,
      subject,
      brand,
      vendorPrice,
      price,
      available,
      isFeatured,
      isActive,
      stockCountPending,
      vendor,
      description,
      tags,
      media,
      targetAge,
      options,
      vendor_name,
      brand_name,
      subject_name,
      category_name,
      isbn,
    } = req.body;

    let data = await Product.findByIdAndUpdate(req.params.id, {
      title,
      category,
      brand,
      subject,
      vendorPrice,
      price,
      isFeatured,
      available,
      vendor,
      isActive,
      stockCountPending,
      description,
      tags,
      profitMargin: price - vendorPrice,
      media,
      options,
      targetAge,
      vendor_name,
      brand_name,
      subject_name,
      category_name,
      isbn,
      updatedBy: req.userId,
    });

    const user = await User.findById(req.userId);
    const _vendorData = await User.findById(vendor);

    // if (user?.role === "Admin") {
    //   let emailInput = {
    //     subject: "Product updates",
    //     html: `<strong>Your product ${title} has been updated</strong>`,
    //   };
    //   await send_email(_vendorData.email, emailInput)
    //     .then((res) => {
    //       console.log(res);
    //     })
    //     .catch((err) => {
    //       return res.status(500).json({ error: err });
    //     });
    // }

    res.status(200).json({
      message: "Product has been updated",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};


const exportProductsToExcel = async (req, res) => {
  try {
    const { startDate, endDate, ...filters } = req.query;
    
    // =============== EXTRACT PHASE ===============
    let query = {};
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    // Apply other filters
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        query[key] = filters[key];
      }
    });
    
    // Extract data from database with related collections
    const products = await Product.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryData"
        }
      },
      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brandData"
        }
      },
      {
        $lookup: {
          from: "subjects",
          localField: "subject",
          foreignField: "_id",
          as: "subjectData"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "vendor",
          foreignField: "_id",
          as: "vendorData"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdByData"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "updatedBy",
          foreignField: "_id",
          as: "updatedByData"
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    
    // =============== TRANSFORM PHASE ===============
    // Use SAME KEYS as in worksheet.columns
    const transformedData = products.map(product => {
      
      // Helper function to safely handle array joins
      const safeJoin = (arr, separator = ", ") => {
        if (!arr) return "N/A";
        if (Array.isArray(arr)) {
          return arr.filter(item => item != null).join(separator);
        }
        if (typeof arr === 'string') return arr;
        return "N/A";
      };
      
      // NOTE: Use EXACT SAME KEY NAMES as in worksheet.columns
      return {
        // Column 1
        'No.': '', // This will be filled later with index
        
        // Product Details - EXACT KEY NAMES
        'Product ID': product._id?.toString() || "N/A",
        'Product Code': product.productCode || "N/A",
        'ISBN': product.isbn || "N/A",
        'Title': product.title || "N/A",
        'Description': product.description 
          ? (product.description.length > 100 
              ? product.description.substring(0, 100) + "..." 
              : product.description)
          : "N/A",
        
        // Pricing
        'Price': `₹${product.price || 0}`,
        'Vendor Price': `₹${product.vendorPrice || 0}`,
        'Profit Margin': `₹${product.profitMargin || 0}`,
        
        // Categories
        'Category': product.categoryData?.[0]?.name || product.category_name || "N/A",
        'Brand': product.brandData?.[0]?.name || product.brand_name || "N/A",
        'Subject': product.subjectData?.[0]?.name || product.subject_name || "N/A",
        
        // Vendor Information
        'Vendor': product.vendorData?.[0]?.name || product.vendor_name || "N/A",
        'Vendor Email': product.vendorData?.[0]?.email || "N/A",
        
        // Stock & Availability
        'Stock Available': product.available || 0,
        'Stock Pending': product.stockCountPending || 0,
        'Total Stock': (product.available || 0) + (product.stockCountPending || 0),
        
        // Status Flags
        'Is Active': product.isActive ? "Yes" : "No",
        'Is Featured': product.isFeatured ? "Yes" : "No",
        
        // Target Age
        'Target Age': product.targetAge || "All",
        
        // Images Count
        'Images Count': product.media?.length || 0,
        
        // Tags - SAFE JOIN
        'Tags': safeJoin(product.tags),
        
        // Dates
        'Created Date': product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-IN') : "N/A",
        'Created Time': product.createdAt ? new Date(product.createdAt).toLocaleTimeString('en-IN') : "N/A",
        'Created By': product.createdByData?.[0]?.name || "N/A",
        
        'Updated Date': product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-IN') : "N/A",
        'Updated Time': product.updatedAt ? new Date(product.updatedAt).toLocaleTimeString('en-IN') : "N/A",
        'Updated By': product.updatedByData?.[0]?.name || "N/A",
        
        // Additional Info
        'Options Count': product.options?.length || 0,
        
        // URLs for reference
        'Image URL': product.imageURL || product.media?.[0]?.imageUrl || "N/A",
        'Product URL': `${req.protocol}://${req.get('host')}/products/${product._id}`
      };
    });
    
    // =============== LOAD PHASE (Excel Export) ===============
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Products Data');
    
    // Add report title and date range
    worksheet.mergeCells('A1:AC1');
    worksheet.getCell('A1').value = 'PRODUCT DATA EXPORT';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    
    worksheet.mergeCells('A2:AC2');
    let dateRangeText = 'All Products';
    if (startDate && endDate) {
      dateRangeText = `Date Range: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    } else if (startDate) {
      dateRangeText = `From: ${new Date(startDate).toLocaleDateString()}`;
    } else if (endDate) {
      dateRangeText = `Until: ${new Date(endDate).toLocaleDateString()}`;
    }
    worksheet.getCell('A2').value = dateRangeText;
    worksheet.getCell('A2').font = { bold: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    
    worksheet.mergeCells('A3:AC3');
    worksheet.getCell('A3').value = `Export Date: ${new Date().toLocaleDateString()} | Export Time: ${new Date().toLocaleTimeString()}`;
    worksheet.getCell('A3').alignment = { horizontal: 'center' };
    
    // Add empty row for spacing
    worksheet.addRow([]);
    
    // Define columns with EXACT key names that match transformedData
    const columns = [
      { header: 'No.', key: 'No.', width: 5 },
      { header: 'Product ID', key: 'Product ID', width: 25 },
      { header: 'Product Code', key: 'Product Code', width: 15 },
      { header: 'ISBN', key: 'ISBN', width: 15 },
      { header: 'Title', key: 'Title', width: 30 },
      { header: 'Description', key: 'Description', width: 40 },
      { header: 'Price', key: 'Price', width: 12 },
      { header: 'Vendor Price', key: 'Vendor Price', width: 15 },
      { header: 'Profit Margin', key: 'Profit Margin', width: 15 },
      { header: 'Category', key: 'Category', width: 15 },
      { header: 'Brand', key: 'Brand', width: 15 },
      { header: 'Subject', key: 'Subject', width: 15 },
      { header: 'Vendor', key: 'Vendor', width: 20 },
      { header: 'Vendor Email', key: 'Vendor Email', width: 25 },
      { header: 'Stock Available', key: 'Stock Available', width: 15 },
      { header: 'Stock Pending', key: 'Stock Pending', width: 15 },
      { header: 'Total Stock', key: 'Total Stock', width: 12 },
      { header: 'Is Active', key: 'Is Active', width: 10 },
      { header: 'Is Featured', key: 'Is Featured', width: 12 },
      { header: 'Target Age', key: 'Target Age', width: 12 },
      { header: 'Images Count', key: 'Images Count', width: 12 },
      { header: 'Tags', key: 'Tags', width: 30 },
      { header: 'Created Date', key: 'Created Date', width: 15 },
      { header: 'Created Time', key: 'Created Time', width: 15 },
      { header: 'Created By', key: 'Created By', width: 20 },
      { header: 'Updated Date', key: 'Updated Date', width: 15 },
      { header: 'Updated Time', key: 'Updated Time', width: 15 },
      { header: 'Updated By', key: 'Updated By', width: 20 },
      { header: 'Options Count', key: 'Options Count', width: 12 },
      { header: 'Image URL', key: 'Image URL', width: 40 },
      { header: 'Product URL', key: 'Product URL', width: 40 }
    ];
    
    // Set columns
    worksheet.columns = columns;
    
    // Add header row - IMPORTANT: Manually add headers
    const headerRow = worksheet.addRow(columns.map(col => col.header));
    
    // Style the header row (row 5)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Add data rows with numbering
    transformedData.forEach((row, index) => {
      // Add serial number
      row['No.'] = index + 1;
      
      // Create array of values in correct column order
      const rowValues = columns.map(col => row[col.key] || '');
      
      // Add row with values
      const dataRow = worksheet.addRow(rowValues);
      
      // Alternate row colors for better readability
      if (index % 2 === 0) {
        dataRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };
        });
      }
      
      // Add borders to all cells
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
    // Auto-fit columns for better readability
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const cellLength = cell.value ? cell.value.toString().length : 0;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = Math.min(Math.max(maxLength + 2, column.width || 10), 50);
    });
    
    // Add summary after all data
    worksheet.addRow([]); // Empty row
    
    // Add summary
    const summaryRow1 = worksheet.addRow(['SUMMARY', '']);
    summaryRow1.getCell(1).font = { bold: true, size: 14 };
    summaryRow1.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    };
    
    const totalProductsRow = worksheet.addRow(['Total Products:', transformedData.length]);
    totalProductsRow.getCell(1).font = { bold: true };
    
    if (transformedData.length > 0) {
      const totalStock = transformedData.reduce((sum, product) => {
        const total = parseInt(product['Total Stock']) || 0;
        return sum + total;
      }, 0);
      
      const totalValue = transformedData.reduce((sum, product) => {
        const price = parseFloat(String(product['Price']).replace('₹', '')) || 0;
        const stock = parseInt(product['Stock Available']) || 0;
        return sum + (price * stock);
      }, 0);
      
      worksheet.addRow(['Total Stock Value:', `₹${totalValue.toFixed(2)}`]);
      worksheet.addRow(['Average Price:', `₹${(totalValue / transformedData.length).toFixed(2)}`]);
      worksheet.addRow(['Total Items in Stock:', totalStock]);
    }
    
    // Style summary rows
    const startRow = transformedData.length + 7; // Adjust based on your row count
    for (let i = startRow; i <= startRow + 5; i++) {
      const row = worksheet.getRow(i);
      if (row) {
        row.eachCell((cell) => {
          if (cell.col === 1) {
            cell.font = { bold: true };
          }
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    }
    
    // Set filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `products_export_${timestamp}.xlsx`;
    const filepath = path.join(__dirname, '..', 'exports', filename);
    
    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    // Save file
    await workbook.xlsx.writeFile(filepath);
    
    // Send file as response
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      // Optionally delete file after sending
      // fs.unlinkSync(filepath);
    });
    
  } catch (error) {
    console.error('ETL Export Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting products to Excel',
      error: error.message
    });
  }
};

/**
 * Export specific product details by ID
 */
const exportProductDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryData"
        }
      },
      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brandData"
        }
      },
      {
        $lookup: {
          from: "subjects",
          localField: "subject",
          foreignField: "_id",
          as: "subjectData"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "vendor",
          foreignField: "_id",
          as: "vendorData"
        }
      }
    ]);
    
    if (!product || product.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Product Details');
    
    const prod = product[0];
    
    // Add product details
    worksheet.mergeCells('A1:C1');
    worksheet.getCell('A1').value = 'PRODUCT DETAILS REPORT';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    
    const details = [
      ['Product ID:', prod._id.toString()],
      ['Product Code:', prod.productCode || 'N/A'],
      ['ISBN:', prod.isbn || 'N/A'],
      ['Title:', prod.title || 'N/A'],
      ['Description:', prod.description || 'N/A'],
      ['Price:', `PKR ${prod.price || 0}`],
      ['Vendor Price:', `PKR ${prod.vendorPrice || 0}`],
      ['Profit Margin:', `PRK ${prod.profitMargin || 0}`],
      ['Category:', prod.categoryData?.[0]?.name || prod.category_name || 'N/A'],
      ['Brand:', prod.brandData?.[0]?.name || prod.brand_name || 'N/A'],
      ['Subject:', prod.subjectData?.[0]?.name || prod.subject_name || 'N/A'],
      ['Vendor:', prod.vendorData?.[0]?.name || prod.vendor_name || 'N/A'],
      ['Stock Available:', prod.available || 0],
      ['Stock Pending:', prod.stockCountPending || 0],
      ['Is Active:', prod.isActive ? 'Yes' : 'No'],
      ['Is Featured:', prod.isFeatured ? 'Yes' : 'No'],
      ['Target Age:', prod.targetAge || 'All'],
      ['Created Date:', prod.createdAt ? new Date(prod.createdAt).toLocaleString() : 'N/A'],
      ['Updated Date:', prod.updatedAt ? new Date(prod.updatedAt).toLocaleString() : 'N/A'],
      ['Tags:', prod.tags?.join(', ') || 'N/A']
    ];
    
    details.forEach(([label, value], index) => {
      const row = worksheet.addRow([label, value]);
      row.getCell(1).font = { bold: true };
      row.getCell(2).alignment = { horizontal: 'left' };
    });
    
    // Auto-fit columns
    worksheet.columns = [
      { width: 20 },
      { width: 40 }
    ];
    
    const filename = `product_${prod.productCode || prod._id}_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    await workbook.xlsx.write(res);
    
  } catch (error) {
    console.error('Product Details Export Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting product details',
      error: error.message
    });
  }
};

/**
 * Route handler for exports
 */
const importProductsFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel file'
      });
    }

    const workbook = new excel.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet(1);

    const results = {
      total: 0,
      success: 0,
      failed: 0,
      errors: [],
      products: []
    };

    // ----------------------------
    // READ HEADERS (ROW 1) and normalize to lowercase
    // ----------------------------
    const headers = [];
    const headerRow = worksheet.getRow(1);

    for (let col = 1; col <= worksheet.columnCount; col++) {
      const cellValue = headerRow.getCell(col).value;
      headers.push(cellValue ? cellValue.toString().trim().toLowerCase() : '');
    }

    console.log('Headers found:', headers);

    // ----------------------------
    // Helper: Get exact matching column index (1-based)
    // Returns null if not found
    // ----------------------------
    const getColumnIndex = (name) => {
      const index = headers.findIndex(h => h === name.toLowerCase());
      return index >= 0 ? index + 1 : null;
    };

    // ----------------------------
    // COLUMN MAPPING
    // ----------------------------
   
    const descriptionCol = getColumnIndex('description');
   
    
    const categoryCol = getColumnIndex('category');
    const brandCol = getColumnIndex('brand');
    const subjectCol = getColumnIndex('subject');
    
   
    const productCodeCol = getColumnIndex('product code');
    const isbnCol = getColumnIndex('isbn');
    const tagsCol = getColumnIndex('tags');
    const targetAgeCol = getColumnIndex('target age');
    const stockAvailableCol = getColumnIndex('stock available');
    const stockPendingCol = getColumnIndex('stock pending');
    const isActiveCol = getColumnIndex('is active');
    const isFeaturedCol = getColumnIndex('is featured');



    // ----------------------------
    // REQUIRED COLUMNS CHECK
    // ----------------------------


    // ----------------------------
    // HELPER FUNCTIONS
    // ----------------------------
    const getCellValue = (row, col) => {
      if (!col) return '';
      const cell = row.getCell(col).value;
      return cell ? cell.toString().trim() : '';
    };

    const getNumber = (row, col) => {
      const val = getCellValue(row, col);
      if (!val) return 0;
      return parseFloat(val.replace(/[₹$,]/g, '')) || 0;
    };

    const getBoolean = (row, col) => {
      const val = getCellValue(row, col).toUpperCase();
      return ['YES', 'Y', '1', 'TRUE'].includes(val);
    };

    // ----------------------------
    // PROCESS ROWS
    // ----------------------------
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);

     
     

      results.total++;

      try {
        const productData = {
          
          description: getCellValue(row, descriptionCol),
         
         
          category_name: getCellValue(row, categoryCol),
          brand_name: getCellValue(row, brandCol),
          subject_name: getCellValue(row, subjectCol),
         
          productCode: getCellValue(row, productCodeCol),
          isbn: getCellValue(row, isbnCol),
          tags: getCellValue(row, tagsCol),
          targetAge: getNumber(row, targetAgeCol),
          available: getNumber(row, stockAvailableCol),
          stockCountPending: getNumber(row, stockPendingCol),
          isActive: getBoolean(row, isActiveCol),
          isFeatured: getBoolean(row, isFeaturedCol)
        };

        // ----------------------------
        // VALIDATION
        // ----------------------------
      
        if (!productData.brand_name) throw new Error('Brand is required');
       

        // ----------------------------
        // CATEGORY
        // ----------------------------
 

        // ----------------------------
        // BRAND
        // ----------------------------
        let brand = await Brand.findOne({ name: new RegExp(`^${productData.brand_name}$`, 'i') });
        if (!brand) {
          brand = await Brand.create({ name: productData.brand_name, isActive: true });
        }

        // ----------------------------
        // SUBJECT (OPTIONAL)
        // ----------------------------
        let subject = null;
        if (productData.subject_name) {
          subject = await Subject.findOne({ name: new RegExp(`^${productData.subject_name}$`, 'i') });
          if (!subject) {
            subject = await Subject.create({ name: productData.subject_name, isActive: true });
          }
        }

        // ----------------------------
        // VENDOR (EMAIL OR NAME)
        // ----------------------------
;


        // ----------------------------
        // FINAL PRODUCT DATA
        // ----------------------------
        const finalProduct = {
          title: productData.title,
          description: productData.description,
          price: productData.price,
         
          category: category._id,
          brand: brand._id,
          subject: subject?._id,
          vendor: vendor._id,
          tags: productData.tags,
          targetAge: productData.targetAge,
          available: productData.available,
          stockCountPending: productData.stockCountPending,
          isActive: productData.isActive,
          isFeatured: productData.isFeatured,
          productCode: productData.productCode || `PROD-${Date.now()}`
        };

        let product = await Product.findOne({
          $or: [
            { productCode: finalProduct.productCode },
            { title: finalProduct.title, vendor: vendor._id }
          ]
        });

        if (product) {
          Object.assign(product, finalProduct);
          await product.save();
          results.products.push({ action: 'updated', title: product.title });
        } else {
          await Product.create(finalProduct);
          results.products.push({ action: 'created', title: finalProduct.title });
        }

        results.success++;

      } catch (err) {
        results.failed++;
        results.errors.push({
          row: i,
          error: err.message,
          data: row.values
        });
      }
    }

    return res.json({
      success: true,
      message: `Import completed: ${results.success} success, ${results.failed} failed`,
      data: results
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Excel import failed',
      error: error.message
    });
  }
};


const downloadExcelTemplate = async (req, res) => {
  try {
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Product Upload Template');
    
    // Add instructions
    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = 'PRODUCT UPLOAD TEMPLATE - INSTRUCTIONS';
    worksheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF0000FF' } };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    
    const instructions = [
      ['INSTRUCTIONS:', ''],
      ['1.', 'Fill data in the columns below. DO NOT modify column headers.'],
      ['2.', 'Required fields: Title, Price, Vendor Price, Category, Brand, Vendor Email'],
      ['3.', 'For existing categories/brands/vendors, use exact names as in system'],
      ['4.', 'For new categories/brands/vendors, they will be created automatically'],
      ['5.', 'Tags should be comma-separated values (e.g., tag1, tag2, tag3)'],
      ['6.', 'Target Age should be a number (e.g., 5, 10, 15)'],
      ['7.', 'Stock values should be numbers only'],
      ['8.', 'For Yes/No fields (Is Active, Is Featured), use YES/NO or Y/N'],
      ['', ''],
      ['REQUIRED FIELDS:', 'DESCRIPTION:'],
      ['Title', 'Product name (e.g., "Mathematics Book Grade 5")'],
      ['Price', 'Selling price (e.g., 500)'],
      ['Vendor Price', 'Cost price from vendor (e.g., 400)'],
      ['Category', 'Category name (e.g., "Books", "Stationery")'],
      ['Brand', 'Brand name (e.g., "Oxford", "Classmate")'],
      ['Vendor Email', 'Vendor email address'],
      ['', ''],
      ['OPTIONAL FIELDS:', 'DESCRIPTION:'],
      ['Description', 'Product description (max 500 characters)'],
      ['Product Code', 'Unique product code (auto-generated if empty)'],
      ['ISBN', 'ISBN number for books'],
      ['Subject', 'Subject name (for educational products)'],
      ['Tags', 'Comma-separated tags'],
      ['Target Age', 'Target age group (number)'],
      ['Stock Available', 'Current stock quantity'],
      ['Stock Pending', 'Pending stock quantity'],
      ['Is Active', 'YES/NO - Product is active for sale'],
      ['Is Featured', 'YES/NO - Featured product'],
      ['', ''],
      ['NOTE:', 'Remove this instruction block before uploading']
    ];
    
    instructions.forEach((row, index) => {
      const worksheetRow = worksheet.addRow(row);
      if (index === 0) {
        worksheetRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF00' }
        };
      }
    });
    
    // Add empty row after instructions
    worksheet.addRow([]);
    
    // Define columns for data entry
    const columns = [
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Price', key: 'price', width: 12 },
      { header: 'Vendor Price', key: 'vendorPrice', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Brand', key: 'brand', width: 20 },
      { header: 'Subject', key: 'subject', width: 20 },
      { header: 'Vendor Email', key: 'vendorEmail', width: 25 },
      { header: 'Product Code', key: 'productCode', width: 15 },
      { header: 'ISBN', key: 'isbn', width: 15 },
      { header: 'Tags', key: 'tags', width: 30 },
      { header: 'Target Age', key: 'targetAge', width: 12 },
      { header: 'Stock Available', key: 'stockAvailable', width: 15 },
      { header: 'Stock Pending', key: 'stockPending', width: 15 },
      { header: 'Is Active', key: 'isActive', width: 10 },
      { header: 'Is Featured', key: 'isFeatured', width: 12 }
    ];
    
    // Set columns
    worksheet.columns = columns;
    
    // Add header row
    const headerRow = worksheet.addRow(columns.map(col => col.header));
    
    // Style header row
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF00B050' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Add some sample data rows
    const sampleData = [
      {
        title: 'Mathematics Book Grade 5',
        description: 'Mathematics textbook for grade 5 students',
        price: 500,
        vendorPrice: 400,
        category: 'Books',
        brand: 'Oxford',
        subject: 'Mathematics',
        vendorEmail: 'vendor@example.com',
        productCode: 'MATH-005',
        isbn: '978-1234567890',
        tags: 'mathematics, grade5, textbook',
        targetAge: 10,
        stockAvailable: 100,
        stockPending: 50,
        isActive: 'YES',
        isFeatured: 'NO'
      },
      {
        title: 'Science Kit',
        description: 'Educational science experiment kit',
        price: 1200,
        vendorPrice: 1000,
        category: 'Educational Kits',
        brand: 'ScienceFun',
        subject: 'Science',
        vendorEmail: 'vendor@example.com',
        productCode: 'SCI-KIT-01',
        isbn: '',
        tags: 'science, experiment, educational',
        targetAge: 12,
        stockAvailable: 50,
        stockPending: 25,
        isActive: 'YES',
        isFeatured: 'YES'
      }
    ];
    
    sampleData.forEach((row, index) => {
      const dataRow = worksheet.addRow([
        row.title,
        row.description,
        row.price,
        row.vendorPrice,
        row.category,
        row.brand,
        row.subject,
        row.vendorEmail,
        row.productCode,
        row.isbn,
        row.tags,
        row.targetAge,
        row.stockAvailable,
        row.stockPending,
        row.isActive,
        row.isFeatured
      ]);
      
      // Alternate row colors
      if (index % 2 === 0) {
        dataRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };
        });
      }
      
      // Add borders
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width || 10, 15);
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=product_upload_template.xlsx');
    
    // Send file
    await workbook.xlsx.write(res);
    
  } catch (error) {
    console.error('Template Download Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading template',
      error: error.message
    });
  }
};


module.exports = {
  downloadExcelTemplate,
  addProduct,
  getAllProducts,
  getAllProductWithoutFilter,
  getProduct,
  deleteProduct,
  updateProduct,
  suggestProducts,
  exportProductsToExcel,
  exportProductDetails,
  importProductsFromExcel
  
};
