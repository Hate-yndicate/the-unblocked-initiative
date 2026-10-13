
window.PROJECTS = (() => {
  const { ME, CDR, RIFT } = window.PEOPLE;
  return [
    {
      title: 'realmz.io',
      state: 'working',
      label: 'Working on',
      info: 'Working on the web socket connections.',
      icon: 'assets/projects/realmz.png',
      anchor: 'https://github.com/smiledemic/realmz-io',
      button: 'View the repo',
      buttonIcon: 'github',
      author: ME
    },
      {
        title: '1v1lol:reloaded',
        state: 'finished',
        label: 'Finished',
        info: 'Finished the HTML5 build and the external build. Planning on making a localBuild.',
        icon: 'assets/projects/1v1lol-reloaded.png',
        anchor: 'https://github.com/smiledemic/1v1lol/tree/main',
        button: 'Get the source',
        buttonIcon: 'github',
        author: ME
      },
    {
      title: 'WannaSmile',
      state: 'finished',
      label: 'Finished',
      info: 'A URL library of highly anticipated projects on the web.',
      icon: 'assets/projects/wannasmile.png',
      anchor: 'https://ankomstudios.github.io./redirect/',
      button: 'Browse the library',
      buttonIcon: 'globe',
      author: ME
    },
    {
      title: 'Ember',
      state: 'started',
      label: 'Started',
      info: 'A new approach to unblocked games.',
      icon: 'assets/projects/ember.png',
      anchor: 'assets/projects/placeholder.png',
      author: CDR
    },
    {
      title: 'RiftsCodex_',
      state: 'finished',
      label: 'Finished',
      info: 'ever wanted codex as a discord bot? rift made one i guess, but its so brainrotted!',
      icon: 'assets/projects/riftscodex.png',
      anchor: 'https://discord.com/oauth2/authorize?client_id=1543379994103914517',
      button: ':discord: Add Codex',
      buttonIcon: 'tab',
      author: RIFT
    },
    {
      title: 'RiftsClaude',
      state: 'finished',
      label: 'Finished',
      info: 'ever wanted claude as a discord bot? rift made one, and it\'s very good! can generate sound, text, and svg files?!',
      icon: 'assets/projects/riftsclaude.jpg',
      video: 'assets/projects/riftsclaude.mp4',
      anchor: 'https://discord.com/oauth2/authorize?client_id=1543426633506103296',
      button: ':discord: Add Claude',
      buttonIcon: 'tab',
      author: RIFT
    }
  ];
})();
