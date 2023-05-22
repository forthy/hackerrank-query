import Fastify from 'fastify'
import { join } from 'path'
import autoLoad from '@fastify/autoload'
import * as TE from 'fp-ts/TaskEither'
import { identity, pipe } from 'fp-ts/function'

const fastify = Fastify({
  logger: true,
})

// Will load all routes under src/routes
fastify.register(autoLoad, {
  dir: join(__dirname, 'routes'),
})

pipe(
  TE.tryCatch(() => fastify.listen({ port: 3000 }), identity),
  TE.match(
    (e) => {
      fastify.log.error(e)
      process.exit(1)
    },
    (a: string) => fastify.log.info(a)
  )
)()
