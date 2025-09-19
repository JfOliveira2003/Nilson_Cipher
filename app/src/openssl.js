import openssl from "openssl-nodejs";

export default function cypherOpenssl(
  text,
  password,
  algorithm,
  decrypt = false
) {
  return new Promise((resolve) => {
    const params = [
      algorithm,
      decrypt ? "-d" : "-e",
      "-in",
      {
        name: "in.txt",
        buffer: decrypt ? text : Buffer.from(text),
      },
      "-k",
      password,
      "-pbkdf2",
    ];

    openssl(params, (err, buffer) => {
      resolve({ err, buffer: Buffer.concat(buffer) });
    });
  });
}
