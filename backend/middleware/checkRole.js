module.exports = (rolesAutorises) => {
  return (req, res, next) => {
    if (!rolesAutorises.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Accès refusé. Vous n'avez pas les permissions nécessaires." 
      });
    }
    next();
  };
};