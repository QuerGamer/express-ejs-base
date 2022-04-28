var { writeFileSync } = require('fs');
var { resolve } = require('path')
var selfsigned = require('selfsigned');
var chalk = require('chalk');

function generatessl() {
	var gssl = selfsigned.generate([{ name: (process.env.SSL_NAME || 'commonName'), value: (process.env.SSL_VALU || 'localhost') }], {
		keySize: parseInt((process.env.SSL_KEY_SIZE || 2048)),
		algorithm: (process.env.SSL_ALGORITHM || 'sha256'),
		days: parseInt((process.env.SSL_DAYS || 90)),
		clientCertificateCN: (process.env.SSL_CLIENT_CERTIFICATE_CN || 'localhost')
	});

	writeFileSync(resolve(process.cwd(), './ssl/key.pem'), `${gssl.private}`, 'utf8');
	writeFileSync(resolve(process.cwd(), './ssl/cert.pem'), `${gssl.cert}`, 'utf8');

	console.log("")
	console.log(chalk.green.bold('Generate Certificate SSL Succeffuly'));
	console.log("")


	console.log(chalk.white.bold(`NOTE: important this SSL for Development Mode not for Production Mode`));
	console.log(chalk.white.bold(`NOTE: because this ssl certificate's signature was created manually`));
	console.log(chalk.white.bold(`NOTE: SSL certificate is used to use authentication using Oauth or package like Passport for auth third part \n`));
}

module.exports = generatessl