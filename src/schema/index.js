const schema = Object.assign(
    {},
    require('./chain_types.json'),
    require('./agrio_system.json'),
    require('./agrio_token.json')
);

module.exports = schema;
