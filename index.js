import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { getUserMail } from "./utilities/utilities.js";
import jwt from "jsonwebtoken";
import { auth } from "./middleware/auth.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT;
const MAIL = process.env.MAIL;
const PASS = process.env.PASS;
const URL = process.env.URL;

const Connection = async (req, res) => {
  try {
    const client = new MongoClient(URL);
    await client.connect();
    console.log("Mongo Connected Successfully");
    return client;
  } catch (error) {
    console.log("Error Occured:", error);
  }
};
export const Client = await Connection();
app.post("/password-reset", async (req, res) => {
  const data = req.body;
  console.log(data);
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    service: "gmail",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "admnbulkmailer@gmail.com", // generated ethereal user
      pass: process.env.GMAIL_PASS, // generated ethereal password
    },
  });
  let info = await transporter
    .sendMail({
      from: `"Password Resetter " <admnbulkmailer@gmail.com>`, // sender address
      to: data.email, // list of receivers
      subject: "Password Reset", // Subject line
      html: `<a href="http://localhost:3000/new-password/${data.email}">click here to reset password</a>`, // html body
    }) 
    .catch(console.error);
  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  console.log(data);
  res.send(data);
});
app.post("/contact", async (req, res) => {
  const data = req.body;
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    service: "gmail",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "admnbulkmailer@gmail.com", // generated ethereal user
      pass: process.env.GMAIL_PASS, // generated ethereal password
    },
  });
  let info = await transporter
    .sendMail({
      from: `"${data.name}" <'${data.mail}'>`, // sender address
      to: "maruthikj4@gmail.com", // list of receivers
      subject: data.sub, // Subject line
      html: `<p>${data.mes} <br/> <br/> <br/> <br/>From:<br/>${data.name}<br/>${data.num}<br/>${data.mail}</p>`, // html body
    })
    .catch(console.error);
  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  console.log(data);
  res.send(data);
});
app.get("/mail-check", async (req, res) => {
  const data = await Client.db("PasswordReset")
    .collection("Mails")
    .find({})
    .toArray();
  res.send(data);
});
app.post("/login", async (req, res) => {
  const password = req.body.password;
  const mail = req.body.email;
  const userFromDb = await getUserMail(mail);
  console.log(userFromDb);
  if (!userFromDb) {
    res.status(209).send({ messege: "Invalid Credentials" });
    return;
  }
  const storedDbPassword = userFromDb.password;
  const isPasswordMatch = await bcrypt.compare(password, storedDbPassword);
  console.log(isPasswordMatch);
  if (!isPasswordMatch) {
    res.status(209).send({ message: "Invalid Credentials" });
    return;
  }
  const token = jwt.sign({ id: userFromDb._id }, process.env.SECRET_KEY);
  res.send({ message: "succesfully Logged In", token: token });
});
app.post("/adduser", async (req, res) => {
  const genPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashAddedPassword = await bcrypt.hash(password, salt);
    return hashAddedPassword;
  };
  const hashedPassword = await genPassword(req.body.password);

  let userdata = {
    email: req.body.email,
    password: hashedPassword,
  };
  const data = await Client.db("PasswordReset")
    .collection("Mails")
    .insertOne(userdata);
  res.send("User added");
});
app.get("/user/auth", async (req, res) => {
  try {
    const token = req.headers.authorization;
    const id = await auth(token);
    const data = await Client.db("PasswordReset")
      .collection("Mails")
      .findOne({ _id: new ObjectId(id) });
    if (data) {
      res.status(200).send(data);
    } else {
      res.status(400).send("Invalud User!");
    }
  } catch (err) {
    console.log(err);
  }
});
app.put("/new-password/:email", async (req, res) => {
  const { email } = req.params;
  const genPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashAddedPassword = await bcrypt.hash(password, salt);
    return hashAddedPassword;
  };
  const hashedPassword = await genPassword(req.body.password);
  const data = await Client.db("PasswordReset")
    .collection("Mails")
    //{Selection_Criteria}, {$set:{Update_data}},
    .findOneAndUpdate(
      { email: `${email}` },
      {
        $set: {
          password: hashedPassword,
        },
      }
    );
  res.send("Password Updated!");
});

app.listen(PORT, () =>
  console.log(`server established successfully On the PORT:${PORT}`)
);

