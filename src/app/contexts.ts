import { createContext } from '@lit/context';

export type Connected = Boolean;
export const connectedContext = createContext<Connected>(Symbol('connected'));

import { type State } from './state';
export { type State } from './state';
export const stateContext = createContext<State>(Symbol('state'));

export type Config = any;
export const configContext = createContext<Config>(Symbol('config'));

export type Log = Array<any>;
export const logContext = createContext<Log>(Symbol('log'));

export type Settings = any;
export const settingsContext = createContext<Settings>(Symbol('settings'));
