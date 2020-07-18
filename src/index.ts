import { x64 } from "murmurhash3js";
import async from "async";
import * as parameters from "./parameters";
import traverse from "traverse";
import { Request, Response, NextFunction } from "express";
import {
  FingerprintResultComponent,
  FingerprintConfig,
  FingerprintResult,
} from "./types";

const Fingerprint = (setting: FingerprintConfig) => {
  const config: FingerprintConfig = {
    parameters: [
      parameters.useragent,
      parameters.acceptHeaders,
      parameters.geoip,
    ],
    ...setting,
  };

  return (req: Request, res: Response, next: NextFunction) => {
    let components: any = {};
    config.req = req;
    let fingerprint: FingerprintResult = { hash: null };
    async.eachLimit(
      config.parameters,
      1,
      (parameter, callback) => {
        parameter.bind(config)(
          (err: Error, obj: FingerprintResultComponent) => {
            for (const key in obj) {
              components[key] = obj[key];
            }
            callback(err);
          },
          req,
          res
        );
      },
      (err) => {
        if (!err) {
          let leaves = traverse(components).reduce(function (acc, x) {
            if (this.isLeaf) acc.push(x);
            return acc;
          }, []);
          fingerprint.hash = x64.hash128(leaves.join("~~~"));
          fingerprint.components = components; // debug
          req.fingerprint = fingerprint;
        }
        next();
      }
    );
  };
};

// for (const key in parameters) {
//   Fingerprint[key] = parameters[key];
// }

export = Fingerprint;
