import { match } from 'react-router';
// eslint-disable-next-line import/no-extraneous-dependencies
import routes from '__app_modules__routes__';

const routesWithStore = typeof routes === 'function' ? store => routes(store) : () => routes;

export default () => async (ctx, next) => {
    const { url } = ctx.req;
    const { history } = ctx.state;

    const appRoutes = await routesWithStore(ctx.state.store);

    await new Promise((resolve, reject) => {
        match(
            { routes: appRoutes, location: url, history },
            (error, redirectLocation, renderProps) => {
                if (error) {
                    reject(error);
                } else if (redirectLocation) {
                    ctx.redirect(
                        (redirectLocation.basename || '') +
                        redirectLocation.pathname + redirectLocation.search
                    );
                } else if (renderProps) {
                    ctx.status = 200;
                    ctx.state.renderProps = renderProps;
                } else {
                    ctx.status = 404;
                    ctx.body = 'Not found';
                }
                resolve();
            }
        );
    });

    if (ctx.status === 200) {
        await next();
    }
};
