# Maintaining this gallery

Preserve this as the user's permanent Arabic, RTL 3D gallery named "مجسّمات 3D". Keep a static site with local dependencies and no mandatory backend. Do not rebuild the entire gallery for every new model.

When the user requests a new object here, create the model, put it under models/, and register it in models.js with a stable unique id, Arabic name, dimensions in centimetres, description and specifications. Use self-contained GLB (glTF 2.0, metres) for portable models; provide an HTML fallback when useful. Include named animation clips for interactive moving parts. Do not claim a generated image is an interactive 3D model.

For the cage, preserve the approved dimensions, opening, materials and door hinge. The original code-rendered fallback is models/cage.html. scripts/build_cage.py regenerates its GLB equivalent.

Validate models in the actual browser. Check loading, controls, animation in both directions, and a mobile breakpoint. Keep errors visible and preserve fallback behavior. Publish through the existing repository and hosting workflow when requested, and verify the public URL before claiming success. Never create a new repository or hosting project for a routine model addition.

Do not store credentials, account configuration, personal data or unapproved reference assets in this public repository. Do not add fake gallery entries. Keep README accurate about hosting and the fact that chat-to-site updates require an actual repository change and deployment.
