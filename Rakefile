require 'rubygems'
require 'packr' # More info: http://blog.jcoglan.com/packr/

FILES = ["lib/texpand.js"]

desc "Minify and pack the source files"
task :pack do |t|
  FILES.each do |filename|
    new_filename = filename.gsub(/\.js$/, '.packed.js')
    js = ""
    File.open(filename, "r") { |f| js = f.read }
    File.open(new_filename, "w") { |f| f.write(Packr.pack(js, :shrink_vars => true, :private => true)) }
  end
end