# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). You also read it on our [website](https://fchat-horizon.github.io/docs/changelog.html).

# [Development]

## [1.30.0-beta.0] - 2024-03-09

> [!WARNING]
> Heed this warning.
> Beta builds **may** have unfound bugs, some of which may be fatal to your data— including chat logs.
>
> If you haven't already, you should make a good habit of backing up your logs.

### Added

- Updated electron [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/3bb81989fe82cafd0baf8c7dedc87b4519fa07d6)
  - This should help wayland bugs on linux, including preformance issues. This also fixes some large security issues found within Rising
- Overhauled build system [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/db43135677cb8e5e57f51bb0ffb417834ccd4103)
- Deb, tar.gz linux builds [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/db43135677cb8e5e57f51bb0ffb417834ccd4103)
- Experimental arch linux builds (`pnpm build:linux:arch`) [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/db43135677cb8e5e57f51bb0ffb417834ccd4103)
- MacOS builds have been melted together in a single, universal `dmg`, which should work on Intel and M1 based systems. [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/d30700d09f0ae2fe3620005d05250b9ee82685fd)
- About page [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/d30700d09f0ae2fe3620005d05250b9ee82685fd)
- Release artifacts now produce SHASUM256.txt file to verify file signatures [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/4d57092007da6a70701cb309d7de4cd0f151efee)

### Fixed

- Fixed a bug the caused chat.ts to never load due to invalid URLs when updating electron past 27 [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/3bb81989fe82cafd0baf8c7dedc87b4519fa07d6)
- Fixed a bug where arm64 release artifacts were still building with x86_64 toolchains, causing them to not function. #15
- Fixed a documentation issue where download links were false in the readme #13 [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/bf8695283e53c28741c6eb893697a3f3d1a003ad) #18
  - Thank you @freenutsxd ♥
  - This was @freenutsxd first contribution~! ♥

### Changed

- Build system now uses electron-builder [[Commit]](https://github.com/Fchat-Horizon/Horizon/commit/d30700d09f0ae2fe3620005d05250b9ee82685fd)
- [CONTRIBUTING.md](/CONTRIBUTING.md) has been updated to reflect the new build system
- [Build scripts](/electron/release-scripts/) are now functionally more robust.

# [Releases]

## [1.29.1] - 2024-03-02

### Added

- Custom character colors! [[Commit](https://github.com/Fchat-Horizon/Horizon/commit/124ffbcaa8498d09a94323f1961eb173e5c5ab65)] [[Docs](https://fchat-horizon.github.io/docs/docs/features-overview.html#custom-character-colors-high-quality-portraits)]
- Proper documentation ([README.md](https://github.com/Fchat-Horizon/Horizon/blob/main/README.md), [CONTRIBUTING.md](https://github.com/Fchat-Horizon/Horizon/blob/main/CONTRIBUTING.md), etc..) [[Commit](https://github.com/Fchat-Horizon/Horizon/commit/ec5b7deb2c2726bcf73ab25e6e24af8087b3ef38)]

### Fixed

- Fixed links opening in internal browser, and profileViewer being non-functional. [[Commit](https://github.com/Fchat-Horizon/Horizon/commit/192dbdce989942334883f9145179e1df5633ba2a)]

### Changed

- Settings have more clear names and use a diffent icon to indicate new settings [[Commit](https://github.com/Fchat-Horizon/Horizon/commit/21de3c1514146e7d5f9e7441fb986e5b74b96aac)]
- High quality portraits can now use the words 'Horizon Portrait' instead ('Rising Portrait' still works to maintain compatablity) [[Commit](https://github.com/Fchat-Horizon/Horizon/commit/e7589d748edc736565147a4f2adb87244cf09977)]
- Build tools now use PNPM instead of Yarn [[Commit](https://github.com/Fchat-Horizon/Horizon/commit/da6771bb95bee8e67f64f85e9243d761f7b44ad1)]
- Added changesets [[Commit](https://github.com/Fchat-Horizon/Horizon/commit/49394bd0d0d5769d3ffa80442063be1dd3d4cc93)]

### Removed

- IOS build removed [[Commit](https://github.com/Fchat-Horizon/Horizon/commit/41261d1ba7043eb7dfd5a1a6331dc604ff338814)]
- Webchat removed [[Commit](https://github.com/Fchat-Horizon/Horizon/commit/b894a180b9be31f68d1458aaa3c59f9c4470da89)]
