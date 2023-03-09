import express from "express";
import redis from "redis";
import fetch from "node-fetch";

const app = express();

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const setResponse = (username, repos) => {
  return `<h2>${username} has ${repos} github repos</h2>`;
};

//cache middleware
function cache(req, res, next) {
  const { username } = req.params;
  client.get(username, (err, data) => {
    if (err) throw err;
    if (data !== null) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  });
}

//get repos func
const getRepos = async (req, res) => {
  try {
    console.log("fetching data");
    const { username } = req.params;
    const resp = await fetch(`https://api.github.com/users/${username}`);
    const data = await resp.json();

    const repos = data.public_repos;

    client.setEx(username, 3600, repos);

    res.send(setResponse(username, repos));
  } catch (error) {
    return res.status(500).json(error);
  }
};
//endpoint
app.get("/repos/:username", cache, getRepos);

app.listen(PORT, () => console.log("Server is running"));
