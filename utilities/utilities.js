import { Client } from "../index.js";

export async function genPassword(password) {
  const salt = await bcrypt.gensalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

export async function getUserMail(email) {
  return await Client.db("PasswordReset")
    .collection("Mails")
    .findOne({ email: email });
}

export async function addUser(email, hashedPassword) {
  return await Client.db("PasswordReset")
    .collection("Mails")
    .insertOne({ email: email, password: hashedPassword });
}
