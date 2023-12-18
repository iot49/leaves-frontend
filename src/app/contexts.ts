import { createContext } from '@lit/context';

import { type IEventBus } from './eventbus';
export { type IEventBus } from './eventbus';
export const eventbusContext = createContext<IEventBus>(Symbol('eventbus'));

import { type State } from './state';
export { type State } from './state';
export const stateContext = createContext<State>(Symbol('state'));

export type Config = any;
export const configContext = createContext<Config>(Symbol('config'));
