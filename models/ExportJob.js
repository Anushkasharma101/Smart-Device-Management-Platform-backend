// models/ExportJob.js
const mongoose = require("mongoose");

const exportJobSchema = new mongoose.Schema({
  organizationId: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  format: { type: String, enum: ["json", "csv"], required: true },
  status: { type: String, enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"], default: "PENDING" },
  filePath: { type: String, default: null },  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

exportJobSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("ExportJob", exportJobSchema);
