import playwright from 'eslint-plugin-playwright';
import baseConfig from '../../eslint.base.config.mjs';

export default [...baseConfig, playwright.configs['flat/recommended']];
