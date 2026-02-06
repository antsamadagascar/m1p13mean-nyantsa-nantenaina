const userService = require('../services/user.service');

const register = async (req, res) => {
  try {
    // await userService.registerUser(req.body);

    // res.status(201).json({
    //   message: 'Inscription réussie'
    // });
    console.log(req.body);

  } catch (error) {
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(409).json({ message: 'Email déjà utilisé' });
    }

    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  register
};
