module.exports = {
  apps : [{
    name: 'rouge-game-backend',
    script: './editor_server_src/index.ts',
    watch: './editor_server_src',
    interpreter: 'node',
    interpreter_args: '-r @swc-node/register',
  }],

};
