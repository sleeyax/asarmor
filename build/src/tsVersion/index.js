"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileCrash = exports.Asarmor = void 0;
var asarmor_1 = __importDefault(require("./asarmor"));
exports.Asarmor = asarmor_1.default;
var fileCrash_1 = __importDefault(require("./protections/fileCrash"));
exports.FileCrash = fileCrash_1.default;
