import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
	{
		ignores: [
			"designs/**",
			"designs/**/*"
		]
	},
	...nextCoreWebVitals,
	...nextTypescript,
	{
		rules: {
			"react-hooks/set-state-in-effect": "off"
		}
	}
];

export default config;
