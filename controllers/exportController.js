 const ExportJob = require("../models/ExportJob");

const DeviceLog = require("../models/Log"); // replace with your actual logs model
const { Parser } = require("json2csv");
const fs = require("fs");
const path = require("path");

async function createExportJob(req, res) {
  try {
    const { startDate, endDate, format } = req.body;
    const { organizationId } = req.user; // make sure authMiddleware sets req.user.organizationId

    if (!startDate || !endDate || !format) {
      return res.status(400).json({ error: "startDate, endDate and format are required" });
    }

    // 1️⃣ Create job in DB
    const newJob = await ExportJob.create({
      organizationId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      format,
      status: "PENDING"
    });

    // 2️⃣ Async worker to generate file
    setTimeout(async () => {
      try {
        console.log(`[Worker] Processing export job ${newJob._id}...`);

        // Fetch logs from DB
        const logs = await DeviceLog.find({
          organizationId,
          date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }).lean();

        // Ensure downloads folder exists
        const downloadsDir = path.join(__dirname, "../downloads");
        if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

        let filePath;

        if (format === "json") {
          // JSON export
          const jsonData = JSON.stringify(logs, null, 2);
          filePath = path.join(downloadsDir, `export_${newJob._id}.json`);
          fs.writeFileSync(filePath, jsonData);
        } else if (format === "csv") {
          // CSV export
          const fields = ["_id", "deviceId", "date", "log"]; // adjust fields as per your schema
          const parser = new Parser({ fields });
          const csv = parser.parse(logs);

          filePath = path.join(downloadsDir, `export_${newJob._id}.csv`);
          fs.writeFileSync(filePath, csv);
        } else {
          throw new Error("Invalid format: must be 'json' or 'csv'");
        }

        // Update job in DB
        await ExportJob.findByIdAndUpdate(newJob._id, {
          status: "COMPLETED",
          filePath
        });

        console.log(`[Worker] Export job ${newJob._id} completed.`);
        console.log(`[Email] Email sent to user with link: ${filePath}`);

      } catch (err) {
        console.error(`[Worker] Job ${newJob._id} failed:`, err);
        await ExportJob.findByIdAndUpdate(newJob._id, { status: "FAILED" });
      }
    }, 5000); // simulate async after 5 sec

    // 3️⃣ Return job response immediately
    return res.status(201).json({
      jobId: newJob._id,
      status: newJob.status,
      message: "Export job created. You will be notified when it is ready."
    });

  } catch (err) {
    console.error("Error in createExportJob:", err);
    res.status(500).json({ error: "Server Error" });
  }
}

async function getExportJobStatus(req, res) {
  try {
    const { jobId } = req.params;
    const job = await ExportJob.findById(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.json({
      jobId: job._id,
      status: job.status,
      downloadUrl: job.status === "COMPLETED" ? job.filePath : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
}



module.exports = { createExportJob, getExportJobStatus };

