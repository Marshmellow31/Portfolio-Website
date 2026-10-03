# Fortuner learning export

Source: https://www.toyotabharat.com/virtual-showroom/fortuner.html

Exported September 6, 2026 from the visible, loaded ONE3D scene. Toyota / ONE3D retain ownership of the source assets.

`fortuner.glb` contains 282 meshes, 1,067,892 vertices, 1,827,172 triangles and 11 embedded color textures. It opens without the vendor runtime or network texture dependencies. Import it into Blender using File > Import > glTF 2.0.

This is a static geometry snapshot including exterior and interior parts. World transforms are baked. Vendor animation, configurator logic, special shaders, environment maps, and normal-map effects are not reproduced; materials approximate the source appearance.

The converter is `scripts/convert-fortuner.mjs`. Its input is the intermediate `fortuner-learning-scene.json` downloaded from the loaded browser scene. Run `node scripts/convert-fortuner.mjs <path-to-json>` from the repository root to rebuild the GLB.

## Mahindra XUV 7XO learning export

Source: https://auto.mahindra.com/360-view?cid=XUV7XO

Assembled September 7, 2026 from 36 publicly loaded model parts. Mahindra retains ownership of the source assets. `xuv7xo.glb` contains 244 meshes and 20 embedded color textures, approximately 46 MB. This is a static AX7L exterior/interior snapshot with approximate materials, not the full vendor configurator. Vendor animation helpers, environment, special shaders, and normal-map effects are not reproduced.

Texture wrapping and repeat are preserved through KHR_texture_transform, including the rear-window sunshade's 50 by 50 repeat. Transparent textures retain alpha blending even when material opacity is 1.

Rebuild with `node scripts/assemble-xuv7xo.mjs <tools-directory> <asset-url-manifest.json> <scene-config.json> <material-config.json>`. Install the conversion dependencies listed in that script into the separate tools directory. The model works locally without vendor runtime or remote textures and can be imported into Blender as glTF 2.0.
