const Rank = require('../models/Rank');
const User = require('../models/User');
const { catchAsync } = require('../utils/helpers');

// Get all ranks
exports.getAllRanks = catchAsync(async (req, res) => {
  const ranks = await Rank.find().sort('level');
  res.status(200).json({
    status: 'success',
    data: ranks
  });
});

// Create a new rank
exports.createRank = catchAsync(async (req, res) => {
  const rank = await Rank.create(req.body);
  res.status(201).json({
    status: 'success',
    data: rank
  });
});

// Update a rank
exports.updateRank = catchAsync(async (req, res) => {
  const rank = await Rank.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  res.status(200).json({
    status: 'success',
    data: rank
  });
});

// Delete a rank
exports.deleteRank = catchAsync(async (req, res) => {
  await Rank.findByIdAndDelete(req.params.id);
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get user's current rank
exports.getUserRank = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.userId).populate('rank');
  res.status(200).json({
    status: 'success',
    data: user.rank
  });
});

// Update user's rank based on points
exports.updateUserRank = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.userId);
  const ranks = await Rank.find().sort('minPoints');
  
  let newRank = null;
  for (const rank of ranks) {
    if (user.points >= rank.minPoints) {
      newRank = rank;
    } else {
      break;
    }
  }

  if (newRank && (!user.rank || user.rank.toString() !== newRank._id.toString())) {
    user.rank = newRank._id;
    await user.save();
  }

  res.status(200).json({
    status: 'success',
    data: newRank
  });
});

// Add points to user
exports.addPoints = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { points } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { points } },
    { new: true }
  );

  // Update rank if necessary
  await this.updateUserRank(req, res);
}); 