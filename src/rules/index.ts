import type { DetectionRule } from "../lib/analysis-types";

import { confidenceRules } from "./confidence-rules";
import { ghostRules } from "./ghost-rules";
import { scamRules } from "./scam-rules";

export const RULESET_VERSION = "0.2.0";

export const allRules: DetectionRule[] = [
  ...ghostRules,
  ...scamRules,
  ...confidenceRules,
];