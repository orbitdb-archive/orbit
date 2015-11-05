Vagrant.configure(2) do |config|
  config.vm.box = "digital_ocean"
  config.vm.synced_folder ".", "/vagrant", disabled: true
  config.vm.synced_folder "./dist/nodejs-linux", "/anonymous-networks", rsync__auto: false

  config.vm.define "node1" do |node|
    node.vm.provision "shell", inline: <<-SHELL
      sudo apt-get update
      sudo apt-get install -y python gcc make g++ git
      sudo apt-get install -y wget htop screen nano

      wget --quiet https://nodejs.org/dist/v4.2.1/node-v4.2.1-linux-x64.tar.gz
      tar -C /usr/local -zxf node-v4.2.1-linux-x64.tar.gz --strip 1

      cd /anonymous-networks
      npm install

      screen -S app -d -m node index
    SHELL

    node.vm.provider :digital_ocean do |provider, override|
      override.ssh.private_key_path = "~/.ssh/digital-ocean"
      override.vm.box               = 'digital_ocean'
      override.vm.box_url           = "https://github.com/smdahlen/vagrant-digitalocean/raw/master/box/digital_ocean.box"
      provider.token                = 'add your token here'
      provider.image                = 'ubuntu-14-04-x64'
      provider.region               = 'AMS3'
      provider.size                 = '512mb'
    end
  end

end
