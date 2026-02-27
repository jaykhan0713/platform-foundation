ECS tasks can override with something like the below, if config lives in SSM parameter store for example.

```
container.addContainer('AdotCollector', {
  image: ecs.ContainerImage.fromEcrRepository(repo),
  entryPoint: ['/awscollector'],   // optional if already in image
  command: ['--config', 'env:OTEL_CONFIG_YAML']
})
```