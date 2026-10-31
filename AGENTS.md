# Maintaining this gallery

Preserve this as the user's permanent Arabic, RTL 3D gallery named "مجسّمات 3D". Keep a static site with local dependencies and no mandatory backend. Do not rebuild the entire gallery for every new model.

When the user requests a new object here, create the model, put it under models/, and register it in models.js with a stable unique id, Arabic name, dimensions in centimetres, description and specifications. Use self-contained GLB (glTF 2.0, metres) for portable models; provide an HTML fallback when useful. Include named animation clips for interactive moving parts. Do not claim a generated image is an interactive 3D model.

For the cage, preserve the approved dimensions, opening, materials and door hinge. The original code-rendered fallback is models/cage.html. scripts/build_cage.py regenerates its GLB equivalent.

Validate models in the actual browser. Check loading, controls, animation in both directions, and a mobile breakpoint. Keep errors visible and preserve fallback behavior. Publish through the existing repository and hosting workflow when requested, and verify the public URL before claiming success. Never create a new repository or hosting project for a routine model addition.

Do not store credentials, account configuration, personal data or unapproved reference assets in this public repository. Do not add fake gallery entries. Keep README accurate about hosting and the fact that chat-to-site updates require an actual repository change and deployment.

Bump the query version of edited JavaScript/CSS/catalogue assets in index.html on publication so returning visitors receive the updated files.

Latest approved cage geometry: rear 120 cm, front 110 cm; roof slopes forward by 10 cm across 110 cm depth. Door clear opening 80 x 104 cm, leaf 79 x 103 cm. Keep materials-cage.js, the GLB generator and the HTML fallback consistent. Material stock lengths supplied by the user: steel bars 6 m, mesh sheets 2 x 1 m. Material quantities and cutting assumptions appear below the viewer; preserve them on future updates.

Hardware highlighting approved: brass-coloured metallic hinges, blue metallic sliding bolt, plate and keeper. Preserve the distinct PBR materials and matching fallback colours. These are visual finishes, not a requirement to buy solid brass hinges.

Latest user instruction overrides the old fallback guidance: keep the primary GLB viewer shown in the reference screenshot as the only viewing experience. Do not switch to the canvas fallback automatically or expose a second-view button. A same-model selection must not reload it. Keep measurements and materials overlaid on the model using assets/annotations.js, with materials tables below.
