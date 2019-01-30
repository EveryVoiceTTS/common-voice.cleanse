vcsrepo { '/opt/common-voice-bundler':
  ensure   => present,
  provider => 'git',
  source   => 'https://github.com/Common-Voice/common-voice-bundler.git',
  revision => '23fee8b082017a799ea442fa44dfad697971ac2b',
}->
exec { 'install common-voice-bundler deps':
  command   => 'yarn',
  logoutput => true,
  cwd       => "/opt/common-voice-bundler",
  path      => [ '/bin', '/usr/bin', '/usr/local/bin' ],
  require   => [
    Class['Nodejs'],
    Exec['install yarn'],
  ],
}

file { "/usr/local/bin/voice-bundler":
    ensure => file,
    owner  => root,
    group  => root,
    mode   => '0755',
    source => 'puppet:///nubis/files/bundler',
}
