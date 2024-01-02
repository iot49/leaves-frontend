import { createContext } from '@lit/context';

import { type State } from './state';
export { type State } from './state';
export const stateContext = createContext<State>(Symbol('state'));

export type Config = any;
export const configContext = createContext<Config>(Symbol('config'));

export type Log = Array<any>;
export const logContext = createContext<Log>(Symbol('log'));
