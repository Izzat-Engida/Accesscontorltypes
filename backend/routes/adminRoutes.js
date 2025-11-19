const express=require('express');
const router=express.Router();

const{getAllUsers,deleteUser,getUser,updateUserAdmin}=require('../controllers/adminController');

const protect=require('../middleware/authMiddleware');
const rbac=require('../middleware/rbac');
router.use(protect)

router.use(rbac(['Admin']))
router.get('/users',getAllUsers);
router.get('/user/:id',getUser);
router.delete('/user/:id',deleteUser);
router.put('/user/:id',updateUserAdmin);

module.exports=router;