import { app } from "../leaf-main"

export type State = Map<string,object>;

function wildcard_match(str, rule) {
  if (!rule.includes('.')) rule = '*.' + rule;
  var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
}

function device_id(cfg, entity_id) {
  const d = entity_id.split('.')[1];
  if (d in cfg.devices) return d;
  for (const [k, v] of Object.entries(cfg.devices)) {
    if ((v as any).alias == d) return k;
  }
  return d;
}

function entity_name(cfg, entity_id) {
  // check entities.yaml
  const n = attr(cfg, entity_id, 'name');
  if (n) return n;

  // check devices.yaml
  try {
    const n = cfg.devices[this.device_id(cfg, entity_id)].name;
    if (n) return n; 
  }
  catch {}

  // default: entity name capitalized
  const a = entity_id.split('.')[2]
  return a.charAt(0).toUpperCase() + a.slice(1);
}

function attr(cfg, entity_id, attribute) {
  for (const [pattern, fields] of Object.entries(cfg.entities)) {
    if (wildcard_match(entity_id, pattern)) {
      try {
        const a = fields[attribute];
        if (a) return a;
      }
      catch {}
    }
  }
  return undefined;
}

export function sort_state(state: State): State {
  const sortStringValues = ([,a], [,b]) => String(a.name).localeCompare(b.name);
  return new Map([...state].sort(sortStringValues));
}

export const state_handler = {
  get(target, prop, _) {
    // const cfg = (window as any).leaf.config;
    const cfg = app.config;
    const entity_id = target.entity_id;
    switch (prop) {
      case 'entity_id': return entity_id;
      case 'value': return target.value;
      case 'timestamp': return target.timestamp;
      case 'name': return entity_name(cfg, entity_id);
      case 'device_id': return device_id(cfg, entity_id);
      default: return attr(cfg, entity_id, prop);
    }
  }

};
