export const auth = async (token) => {
  try {
    const id = await jwt.verify(token, process.env.SECRETE_KEY);
    return id;
  } catch (err) {
    res.send({ error: err.message });
  }
};
