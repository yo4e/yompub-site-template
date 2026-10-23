# Bundled YomPUB reader

This directory contains a tested browser bundle from [YomPUB](https://github.com/yo4e/YomPUB), including its parser Worker. It is a prototype snapshot, not a versioned npm release or a stable API commitment.

`ORIGIN.json` records the source commit and SHA-256 hashes. The source commit is local and has not been pushed to the upstream repository. The published upstream main branch therefore may not reproduce this snapshot. Only source-map comments were removed for this distribution; executable code is unchanged. Source maps and development tooling are not included.

Both modules must be kept together and served over the same HTTP(S) origin. Update them as a pair after testing the bookshelf, all manuscripts, ruby, navigation, cancellation, and narrow layouts. Recalculate the recorded hashes after a bundle update.

The YomPUB code is MIT licensed; see the root `LICENSE`. `THIRD_PARTY_NOTICES.md` preserves the upstream notices. Its CommonMark test-fixture and source-tree paths describe the upstream development project; those fixtures are not included here. The licenses for bundled markdown-it, argparse, entities, linkify-it, mdurl, and uc.micro are retained under `licenses/`.
