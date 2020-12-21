#!/user/bin/bash

if [$1 eq "start"]
then
	brew services start postgresql
	echo "started postgresql"
fi

if [$1 eq "stop"]
then
	brew services stop postgresql
	echo "stopeed postgresql"
fi
