const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const config = require('../../config');
const db = require('../../db');
const logger = require('../../logger');
const Breaker = require('../utils/breaker');

const register = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(422).send({
      status: 'error',
      message: 'Username or password is not provided.'
    });

  const hashedPassword = bcrypt.hashSync(password, 8);

  db.any('SELECT * FROM "Users" WHERE "Username" = $1', username)
    .then(rows => {
      if (rows.length) {
        res.status(422).send({
          status: 'error',
          message: 'The username was already used.'
        });
        throw new Breaker('Username exists');
      }

      return db.one(`
        INSERT INTO "Users" ("Username", "Password")
        VALUES ($1, $2) RETURNING "UserId"`,
      [username, hashedPassword]
      );
    })
    .then(({ UserId }) => {
      // Create a token
      const token = jwt.sign({ UserId }, config.jwtSecret, {
        expiresIn: '24h', // expires in 24 hours
      });

      res.send({ status: 'success', token });
    })
    .catch(err => {
      if (err.name === 'Breaker') return;

      logger.error(err);
      res.status(500).send({
        status: 'error',
        message: 'Internal server error.'
      });
    });
};

const login = (req, res) => {
  if (!req.body.username)
    return res.status(400).send({
      status: 'error',
      message: 'Username is not provided.'
    });
  if (!req.body.password)
    return res.status(400).send({
      status: 'error',
      message: 'Password is not provided.'
    });

  const username = req.body.username;

  db.any('select * from "Users" where "Username" = $1',
    [username])
    .then(rows => {
      const row = rows[0];
      if (!row)
        return res.status(400).send({
          status: 'error',
          message:
                        'No user with such username & password combination.'
        });

      bcrypt.compare(req.body.password, row.Password)
        .then((areMatch) => {
          if (!areMatch)
            return res.status(400).send({
              status: 'error',
              message: 'No user with such username \
                                & password combination.'
            });
          // Create a token
          const token = jwt.sign(
            { UserId: row.UserId },
            config.jwtSecret,
            { expiresIn: '24h' } // expires in 24 hours
          );
          res.send({ status: 'success', token });
        });
    }, err => {
      logger.error(err);
      res.status(500).send({
        status: 'error',
        message: 'Error with the database.'
      });
    });
};


module.exports = {
  register,
  login,
};
