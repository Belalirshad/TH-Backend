const clientModel = require("../model/client.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const request = require("request");

exports.register = async (req, res) => {
  try {
    console.log("Registering a client !");
    const { companyName, email, password } = req.body;

    const salt = bcrypt.genSaltSync(parseInt(10));
    const hashPassword = bcrypt.hashSync(password, salt);

    const createuser = await clientModel.create({
      companyName: companyName,
      email: email.toLowerCase(),
      password: hashPassword,
    });

    return res.status(201).send({
      status: 201,
      message: "Registration is successfull !",
      data: createuser,
    });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// login user
exports.login = async (req, res) => {
  try {
    const payload = {
      _id: req.user._id,
      companyName: req.user.companyName,
      email: req.user.email,
      role: req.user.role,
    };

    const token = jwt.sign(payload, "THAKURHOSPITALSECRETKEY", {
      expiresIn: "8h",
    });
    // console.log(token,"=====>");

    payload["token"] = token;
    if (token) {
      await clientModel.updateOne(
        { email: payload.email },
        {
          $set: {
            lastLogin: Date.now(),
          },
        }
      );

      return res.send({
        status: 200,
        message: "User logged in successfully",
        data: payload,
      });
    }
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

// @GET patient list

exports.reportList = async (req, res) => {
  try {
    console.log("Get the client list !");
    const { role } = req.user;
    if (role === "ADMIN") {
      return res.send({
        status: 403,
        message: "You are not allowed to access this route !",
      });
    }
    const clientList = await clientModel
      .find({
        companyName: req.user.companyName,
        isDeleted: false,
        cloudinary_id: { $exists: true },
      })
      .select({ companyName: 1, document: 1, cloudinary_id: 1 })
      .lean();

    return res.status(200).send({
      status: 200,
      message: "Client Minified List !",
      data: clientList,
    });
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    console.log("Downloading file");
    const fileUrl = req.body.url;

    // Download the file and send it to the client
    request.get(fileUrl).pipe(res);
 
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};
//@upload document list
exports.documentList = async (req, res) => {
  try {
    // const role = req.user.role;
    let data = await clientModel
      .find({ role: "CLIENT" })
      .select({
        companyName: 1,
        email: 1,
        document: 1,
        cloudinary_id: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .lean();
      let finalData =[];
    data.map((e) =>{
      finalData.push({
        document: e.document,
        uploadedAt: moment(e.createdAt).format("DD-MM-YYYY"),
        category: 'LAB TEST',
        companyName: e.companyName,
        cloudinary_id: e.cloudinary_id
      })
    })
   return res.status(200).send({status:500, message: 'Uploaded document list', data: finalData});
  } catch (err) {
    return res.status(500).send({ status: 500, message: err.message });
  }
};
