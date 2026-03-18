const express = require("express");
const build5KPlanEngine = require("../build5KPlanEngine");

const router = express.Router();

router.post("/generate-plan", (req, res) => {

  try {

    const {
      goalTime,
      weeks,
      currentTime,
      frequency,
      currentVolume
    } = req.body;

    const plan = build5KPlanEngine({
      currentTime: currentTime || goalTime,
      goalTime: goalTime,
      weeks: Number(weeks),
      frequency: Number(frequency) || 3,
      currentVolume: Number(currentVolume) || 20
    });

    res.json(plan);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Plan generation failed" });
  }

});

module.exports = router;