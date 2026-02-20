const { PrizeDistributionRule, Match, AdminLog } = require('../models');
const { BadRequestError, NotFoundError } = require('../middleware/errorHandler');
const mongoose = require('mongoose');

// Get all prize distribution rules
exports.getRules = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      matchType,
      gameType,
      isActive,
      sortBy = 'priority',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (matchType) query.matchType = matchType;
    if (gameType) query.gameType = gameType;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const rules = await PrizeDistributionRule.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await PrizeDistributionRule.countDocuments(query);

    res.json({
      success: true,
      rules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single prize distribution rule
exports.getRule = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid rule ID');
    }

    const rule = await PrizeDistributionRule.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!rule) {
      throw new NotFoundError('Prize distribution rule not found');
    }

    res.json({ success: true, rule });
  } catch (error) {
    next(error);
  }
};

// Create new prize distribution rule
exports.createRule = async (req, res, next) => {
  try {
    const {
      name,
      description,
      matchType,
      gameType,
      distributionType,
      positionConfig,
      killConfig,
      percentageConfig,
      minParticipants,
      maxParticipants,
      entryFeeRange,
      prizePoolRange,
      rules,
      termsAndConditions,
      specialConditions,
      priority,
      isActive,
      isDefault,
      effectiveFrom,
      effectiveUntil
    } = req.body;

    // Validate required fields
    if (!name || !distributionType) {
      throw new BadRequestError('Name and distribution type are required');
    }

    // Validate distribution config based on type
    if (distributionType === 'position_based' || distributionType === 'hybrid') {
      if (!positionConfig || !positionConfig.positions || positionConfig.positions.length === 0) {
        throw new BadRequestError('Position configuration is required for position-based distribution');
      }
    }

    if (distributionType === 'kill_based' || distributionType === 'hybrid') {
      if (!killConfig || killConfig.perKillPrize === undefined) {
        throw new BadRequestError('Kill configuration is required for kill-based distribution');
      }
    }

    if (distributionType === 'percentage') {
      if (!percentageConfig || !percentageConfig.distributions || percentageConfig.distributions.length === 0) {
        throw new BadRequestError('Percentage configuration is required for percentage-based distribution');
      }
    }

    // If setting as default, unset any existing default
    if (isDefault) {
      await PrizeDistributionRule.updateMany(
        { isDefault: true },
        { isDefault: false }
      );
    }

    const rule = new PrizeDistributionRule({
      name,
      description,
      matchType: matchType || 'all',
      gameType: gameType || 'all',
      distributionType,
      positionConfig: positionConfig || {},
      killConfig: killConfig || {},
      percentageConfig: percentageConfig || {},
      minParticipants: minParticipants || 2,
      maxParticipants: maxParticipants || 100,
      entryFeeRange: entryFeeRange || { min: 0, max: null },
      prizePoolRange: prizePoolRange || { min: 0, max: null },
      rules: rules || [],
      termsAndConditions: termsAndConditions || [],
      specialConditions: specialConditions || [],
      priority: priority || 0,
      isActive: isActive !== undefined ? isActive : true,
      isDefault: isDefault || false,
      effectiveFrom: effectiveFrom || new Date(),
      effectiveUntil: effectiveUntil || null,
      createdBy: req.user._id
    });

    await rule.save();

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'create_prize_distribution_rule',
      details: {
        ruleId: rule._id,
        ruleName: rule.name,
        distributionType: rule.distributionType
      }
    });

    res.status(201).json({
      success: true,
      message: 'Prize distribution rule created successfully',
      rule
    });
  } catch (error) {
    next(error);
  }
};

// Update prize distribution rule
exports.updateRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const changeReason = req.body.changeReason || 'No reason provided';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid rule ID');
    }

    const rule = await PrizeDistributionRule.findById(id);
    if (!rule) {
      throw new NotFoundError('Prize distribution rule not found');
    }

    // Store previous version
    const previousVersion = {
      version: rule.version,
      data: rule.toObject(),
      changedAt: new Date(),
      changedBy: req.user._id,
      changeReason
    };

    // If setting as default, unset any existing default
    if (updateData.isDefault) {
      await PrizeDistributionRule.updateMany(
        { isDefault: true, _id: { $ne: id } },
        { isDefault: false }
      );
    }

    // Update fields
    const allowedUpdates = [
      'name', 'description', 'matchType', 'gameType', 'distributionType',
      'positionConfig', 'killConfig', 'percentageConfig',
      'minParticipants', 'maxParticipants', 'entryFeeRange', 'prizePoolRange',
      'rules', 'termsAndConditions', 'specialConditions',
      'priority', 'isActive', 'isDefault', 'effectiveFrom', 'effectiveUntil'
    ];

    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        rule[field] = updateData[field];
      }
    });

    rule.updatedBy = req.user._id;
    rule.previousVersions.push(previousVersion);

    await rule.save();

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'update_prize_distribution_rule',
      details: {
        ruleId: rule._id,
        ruleName: rule.name,
        changes: Object.keys(updateData),
        changeReason
      }
    });

    res.json({
      success: true,
      message: 'Prize distribution rule updated successfully',
      rule
    });
  } catch (error) {
    next(error);
  }
};

// Delete prize distribution rule
exports.deleteRule = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid rule ID');
    }

    const rule = await PrizeDistributionRule.findById(id);
    if (!rule) {
      throw new NotFoundError('Prize distribution rule not found');
    }

    // Check if rule is being used by any matches
    const matchesUsingRule = await Match.countDocuments({
      prizeDistributionRule: id,
      status: { $in: ['upcoming', 'registration_open', 'live'] }
    });

    if (matchesUsingRule > 0) {
      throw new BadRequestError(
        `Cannot delete rule. ${matchesUsingRule} active match(es) are using this rule.`
      );
    }

    await PrizeDistributionRule.findByIdAndDelete(id);

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'delete_prize_distribution_rule',
      details: {
        ruleId: id,
        ruleName: rule.name
      }
    });

    res.json({
      success: true,
      message: 'Prize distribution rule deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Toggle rule active status
exports.toggleRuleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid rule ID');
    }

    const rule = await PrizeDistributionRule.findById(id);
    if (!rule) {
      throw new NotFoundError('Prize distribution rule not found');
    }

    rule.isActive = !rule.isActive;
    rule.updatedBy = req.user._id;
    await rule.save();

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'toggle_prize_distribution_rule_status',
      details: {
        ruleId: rule._id,
        ruleName: rule.name,
        newStatus: rule.isActive ? 'active' : 'inactive'
      }
    });

    res.json({
      success: true,
      message: `Rule ${rule.isActive ? 'activated' : 'deactivated'} successfully`,
      rule
    });
  } catch (error) {
    next(error);
  }
};

// Set rule as default
exports.setDefaultRule = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid rule ID');
    }

    const rule = await PrizeDistributionRule.findById(id);
    if (!rule) {
      throw new NotFoundError('Prize distribution rule not found');
    }

    // Unset any existing default
    await PrizeDistributionRule.updateMany(
      { isDefault: true },
      { isDefault: false }
    );

    // Set this rule as default
    rule.isDefault = true;
    rule.updatedBy = req.user._id;
    await rule.save();

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'set_default_prize_distribution_rule',
      details: {
        ruleId: rule._id,
        ruleName: rule.name
      }
    });

    res.json({
      success: true,
      message: 'Default rule set successfully',
      rule
    });
  } catch (error) {
    next(error);
  }
};

// Get rule version history
exports.getRuleHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid rule ID');
    }

    const rule = await PrizeDistributionRule.findById(id)
      .populate('previousVersions.changedBy', 'name email');

    if (!rule) {
      throw new NotFoundError('Prize distribution rule not found');
    }

    res.json({
      success: true,
      history: rule.previousVersions,
      currentVersion: rule.version
    });
  } catch (error) {
    next(error);
  }
};

// Restore rule to previous version
exports.restoreRuleVersion = async (req, res, next) => {
  try {
    const { id, version } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid rule ID');
    }

    const rule = await PrizeDistributionRule.findById(id);
    if (!rule) {
      throw new NotFoundError('Prize distribution rule not found');
    }

    const previousVersion = rule.previousVersions.find(v => v.version === parseInt(version));
    if (!previousVersion) {
      throw new NotFoundError('Version not found');
    }

    // Store current version before restore
    const currentVersion = {
      version: rule.version,
      data: rule.toObject(),
      changedAt: new Date(),
      changedBy: req.user._id,
      changeReason: `Restored from version ${version}`
    };

    // Restore previous version data
    const restoredData = previousVersion.data;
    Object.assign(rule, restoredData);
    rule.version = Math.max(...rule.previousVersions.map(v => v.version)) + 1;
    rule.updatedBy = req.user._id;
    rule.previousVersions.push(currentVersion);

    await rule.save();

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'restore_prize_distribution_rule_version',
      details: {
        ruleId: rule._id,
        ruleName: rule.name,
        restoredFromVersion: version,
        newVersion: rule.version
      }
    });

    res.json({
      success: true,
      message: `Rule restored to version ${version}`,
      rule
    });
  } catch (error) {
    next(error);
  }
};

// Preview prize distribution for a match
exports.previewDistribution = async (req, res, next) => {
  try {
    const { ruleId, matchId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ruleId) || !mongoose.Types.ObjectId.isValid(matchId)) {
      throw new BadRequestError('Invalid rule or match ID');
    }

    const rule = await PrizeDistributionRule.findById(ruleId);
    if (!rule) {
      throw new NotFoundError('Prize distribution rule not found');
    }

    const match = await Match.findById(matchId).populate('joinedUsers.user', 'name inGameName');
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    // Calculate distribution preview
    const participants = match.joinedUsers.map((ju, index) => ({
      userId: ju.user._id,
      name: ju.user.name,
      inGameName: ju.inGameName,
      position: index + 1, // Simulated position
      kills: Math.floor(Math.random() * 10) // Simulated kills for preview
    }));

    const distribution = rule.calculateDistribution(match, participants);

    res.json({
      success: true,
      preview: {
        match: {
          id: match._id,
          title: match.title,
          prizePool: match.prizePool,
          entryFee: match.entryFee
        },
        rule: {
          id: rule._id,
          name: rule.name,
          distributionType: rule.distributionType
        },
        distribution,
        totalDistributed: distribution.reduce((sum, d) => sum + d.prize, 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get applicable rule for a match
exports.getApplicableRule = async (req, res, next) => {
  try {
    const { matchId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      throw new BadRequestError('Invalid match ID');
    }

    const match = await Match.findById(matchId);
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    const rule = await PrizeDistributionRule.findApplicableRule(match);

    res.json({
      success: true,
      match: {
        id: match._id,
        title: match.title,
        matchType: match.matchType,
        gameType: match.gameType,
        prizePool: match.prizePool,
        entryFee: match.entryFee,
        maxSlots: match.maxSlots
      },
      applicableRule: rule
    });
  } catch (error) {
    next(error);
  }
};

// Duplicate a rule
exports.duplicateRule = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid rule ID');
    }

    const originalRule = await PrizeDistributionRule.findById(id);
    if (!originalRule) {
      throw new NotFoundError('Prize distribution rule not found');
    }

    const newRule = new PrizeDistributionRule({
      name: `${originalRule.name} (Copy)`,
      description: originalRule.description,
      matchType: originalRule.matchType,
      gameType: originalRule.gameType,
      distributionType: originalRule.distributionType,
      positionConfig: originalRule.positionConfig,
      killConfig: originalRule.killConfig,
      percentageConfig: originalRule.percentageConfig,
      minParticipants: originalRule.minParticipants,
      maxParticipants: originalRule.maxParticipants,
      entryFeeRange: originalRule.entryFeeRange,
      prizePoolRange: originalRule.prizePoolRange,
      rules: originalRule.rules,
      termsAndConditions: originalRule.termsAndConditions,
      specialConditions: originalRule.specialConditions,
      priority: originalRule.priority,
      isActive: false, // Duplicated rules start as inactive
      isDefault: false, // Cannot duplicate as default
      effectiveFrom: new Date(),
      effectiveUntil: originalRule.effectiveUntil,
      createdBy: req.user._id
    });

    await newRule.save();

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'duplicate_prize_distribution_rule',
      details: {
        originalRuleId: originalRule._id,
        originalRuleName: originalRule.name,
        newRuleId: newRule._id,
        newRuleName: newRule.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Rule duplicated successfully',
      rule: newRule
    });
  } catch (error) {
    next(error);
  }
};

// Bulk update rules
exports.bulkUpdateRules = async (req, res, next) => {
  try {
    const { ruleIds, updates } = req.body;

    if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
      throw new BadRequestError('Rule IDs array is required');
    }

    const validIds = ruleIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== ruleIds.length) {
      throw new BadRequestError('One or more invalid rule IDs');
    }

    const allowedBulkUpdates = ['isActive', 'priority', 'matchType', 'gameType'];
    const filteredUpdates = {};
    
    allowedBulkUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      throw new BadRequestError('No valid update fields provided');
    }

    filteredUpdates.updatedBy = req.user._id;

    const result = await PrizeDistributionRule.updateMany(
      { _id: { $in: validIds } },
      { $set: filteredUpdates }
    );

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'bulk_update_prize_distribution_rules',
      details: {
        ruleIds: validIds,
        updates: filteredUpdates,
        modifiedCount: result.modifiedCount
      }
    });

    res.json({
      success: true,
      message: `${result.modifiedCount} rule(s) updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

// Get rule statistics
exports.getRuleStats = async (req, res, next) => {
  try {
    const stats = await PrizeDistributionRule.aggregate([
      {
        $group: {
          _id: null,
          totalRules: { $sum: 1 },
          activeRules: { $sum: { $cond: ['$isActive', 1, 0] } },
          defaultRules: { $sum: { $cond: ['$isDefault', 1, 0] } },
          byMatchType: {
            $push: '$matchType'
          },
          byGameType: {
            $push: '$gameType'
          },
          byDistributionType: {
            $push: '$distributionType'
          }
        }
      }
    ]);

    const matchTypeCounts = {};
    const gameTypeCounts = {};
    const distributionTypeCounts = {};

    if (stats.length > 0) {
      stats[0].byMatchType.forEach(type => {
        matchTypeCounts[type] = (matchTypeCounts[type] || 0) + 1;
      });
      stats[0].byGameType.forEach(type => {
        gameTypeCounts[type] = (gameTypeCounts[type] || 0) + 1;
      });
      stats[0].byDistributionType.forEach(type => {
        distributionTypeCounts[type] = (distributionTypeCounts[type] || 0) + 1;
      });
    }

    res.json({
      success: true,
      stats: {
        total: stats[0]?.totalRules || 0,
        active: stats[0]?.activeRules || 0,
        inactive: (stats[0]?.totalRules || 0) - (stats[0]?.activeRules || 0),
        defaults: stats[0]?.defaultRules || 0,
        byMatchType: matchTypeCounts,
        byGameType: gameTypeCounts,
        byDistributionType: distributionTypeCounts
      }
    });
  } catch (error) {
    next(error);
  }
};
