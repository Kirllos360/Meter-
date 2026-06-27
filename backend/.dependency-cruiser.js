module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies are not allowed',
      from: {},
      to: { circular: true }
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Orphan modules should not exist',
      from: { orphan: true },
      to: {}
    },
    {
      name: 'no-deprecated-core',
      comment: 'Do not use deprecated Node.js modules',
      severity: 'warn',
      from: {},
      to: { dependencyTypes: ['deprecated'] }
    },
    {
      name: 'not-to-dev-dep',
      severity: 'error',
      comment: 'Do not import dev dependencies in production code',
      from: { path: '^src/' },
      to: { dependencyTypes: ['npm-dev'] }
    },
    {
      name: 'no-duplicate-dep-types',
      severity: 'warn',
      from: {},
      to: { moreThanOneDependencyType: true }
    },
    {
      name: 'not-to-test',
      comment: 'Do not import test code from src',
      severity: 'error',
      from: { path: '^src/' },
      to: { path: '^test/' }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    exclude: {
      path: '\\.spec\\.ts$|\\.test\\.ts$|\\.d\\.ts$|node_modules/'
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'default']
    }
  }
};
