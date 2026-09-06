# Bullet 350 viewer integration

The `/creative` hero embeds Royal Enfield's hosted Bullet 350 InfinityRT scene from:

- Configurator: https://makeityours.royalenfield.com/configurator/bullet350
- Scene CDN: `https://reconfiguratorprod.royalenfield.com/models/J1B10SEP2024/bullet350/Web/model_gl/`

## What the integration does

This is an adapter around Royal Enfield's public web scene. It does not download, convert, or claim ownership of the motorcycle mesh. The proprietary `.dat` geometry and textures remain on Royal Enfield's CDN and are loaded at runtime. The public InfinityRT JavaScript dependencies are mirrored under `vendor/` because Chrome blocked some cross-origin script responses; their inclusion does not assert ownership or redistribution rights.

`CreativeHero.jsx` embeds `index.html` in an iframe so the renderer's global scripts do not leak into React. `viewer.js` then:

1. Creates the WebGL context and InfinityRT scene.
2. Hides the showroom group while retaining the supplied environment lighting.
3. Applies the `color_vis:premium` state for Black Gold by default.
4. Moves the orbit target toward the engine so the rear display stand does not define the rotation centre.
5. Starts slow idle rotation, pauses after input, and constrains vertical orbit.
6. Relays vertical touch and wheel input to the parent page so the full-screen hero remains scrollable.
7. Pauses rendering while the hero is outside the viewport and respects reduced-motion preferences.

## How the source was identified

1. Open the official configurator and use browser developer tools.
2. In **Network**, filter for `SSE.js`, `InfinityRT_Navigation.js`, `.dat`, or `bullet350`.
3. Inspect the loaded scene URLs and confirm that the renderer is InfinityRT rather than Three.js.
4. Inspect the configurator's scene calls to identify the showroom group (`P3F4_Room_3D_0001`) and finish states (`color_vis:premium`, `color_vis:black`).
5. Save the required public runtime scripts under `vendor/` to avoid cross-origin response blocking, while leaving the proprietary scene geometry and textures on the original CDN.
6. Load the scene base URL in an isolated local page, then add only the navigation, finish, loading, accessibility, and parent-scroll adapter code required by the portfolio.

This procedure references public network requests. It is not a standalone GLB export or a licence to redistribute Royal Enfield's assets. A public deployment depends on Royal Enfield continuing to serve these files and should only be used with appropriate permission.
