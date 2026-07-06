const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const staking = require('../controller/staking');

router.get('/plans', staking.getPlans);

router.get('/my-staking', auth, staking.getMyStaking);
router.post('/subscribe', auth, staking.subscribe);
router.post('/unsubscribe', auth, staking.unsubscribe);
router.post('/claim', auth, staking.claim);

router.get('/admin/plans', auth, adminAuth, staking.adminGetPlans);
router.post('/admin/plans', auth, adminAuth, staking.adminCreatePlan);
router.put('/admin/plans/:id', auth, adminAuth, staking.adminUpdatePlan);
router.delete('/admin/plans/:id', auth, adminAuth, staking.adminDeletePlan);
router.get('/admin/all-staking', auth, adminAuth, staking.adminGetAllStaking);

module.exports = router;
