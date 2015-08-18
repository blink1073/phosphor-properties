require('dts-generator').generate({
  name: 'phosphor-properties',
  main: 'phosphor-properties/index',
  baseDir: 'lib',
  files: ['index.d.ts'],
  out: 'lib/phosphor-properties.d.ts',
});
