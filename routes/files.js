const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const File = require("../models/file");
const { v4: uuid4 } = require("uuid");
const sendMail = require("../services/email.Service");

let storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, "uploads/"),
  filename: (req, file, callback) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    callback(null, uniqueName);
  },
});
let upload = multer({
  storage: storage,
  limit: { fileSize: 1000000 * 100 },
}).single("myfile");
router.post("/", (req, res) => {
  //store file
  upload(req, res, async (err) => {
    //valid req
    if (!req.file) {
      return res.json({ error: "all feilds are required" });
    }
    if (err) {
      return res.status(500).send({ error: err.message });
    }
    //store db
    const file = new File({
      filename: req.file.filename,
      uuid: uuid4(),
      path: req.file.path,
      size: req.file.size,
    });

    const response = await file.save();
    return res.json({ file: `${process.env.APP_BASE}/files/${response.uuid}` });
  });
});

router.post("/send", async (req, res) => {
  //validate
  const { uuid, emailTo, emailFrom } = req.body;
  if (!uuid || !emailFrom || !emailTo) {
    return res.status(422).send({ error: "feilds required" });
  }
  //get data from DB
  const file = await File.findOne({ uuid: uuid });
  if (file.sender) {
    return res.status(422).send({ error: "already sent" });
  }
  file.sender = emailFrom;
  file.reciever = emailTo;
  const response = await file.save();

  //send email
  const sendMail = require("../services/email.Service");
  sendMail({
    from: emailFrom,
    to: emailTo,
    text: `${emailFrom} shared a file with you`,
    subject: "file sharing testing",
    html: require("../services/emailTemplate")({
      emailFrom: emailFrom,
      downloadLink: `${process.env.APP_BASE}/files/${file.uuid}`,
      size: parseInt(file.size / 1000) + "KB",
      expires: "24hrs",
    }),
  });
  return res.send({ success: true });
});

module.exports = router;
