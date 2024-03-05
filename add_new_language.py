import json, os, shutil

def main():
    # insert your ISO code and dropdown description
    lang_info = {"ISO":"", "description":""}

    # Visit https://github.com/EveryVoiceTTS/common-voice and make sure you are on branch dev/ilt;
    # Add str to locales/all.json in order to get that new language to show up in the UI's top-right dropdown box;

    add_iso_to_list(lang_info["ISO"], "locales/all.json")

    # Add str to locales/contributable.json. We weren't sure what locales/contributable.json is for so we also added str to it;
    add_iso_to_list(lang_info["ISO"], "locales/contributable.json")

    # In order to get the new language name to properly show up in the UI, add its full name to locales/native-names.json. This looks like "str": "SENĆOŦEN Origin Stories",.;
    add_iso_to_list(lang_info["ISO"],"locales/native-names.json", lang_info["description"])

    # Again, we weren't sure what locales/translated.json is for and opted to add str;
    add_iso_to_list(lang_info["ISO"], "locales/translated.json")


    # We want the UI to be in English even for str, you will have to use the English localizations for your new language. We need to modify our template web/locales/en/messages.ftl to add our new language code with its description.
    #     Open web/locales/en/messages.ftl,
    #     Find the proper ##Languages section and add str = SENĆOŦEN,
     # We also need to update messages.ftl for all other locales. For this, copy the modified web/locales/en/messages.ftl to all other web/locales/*/.

    for d in os.listdir("web/locales/"):
        if d != lang_info["ISO"]:
            update_message_file(lang_info["ISO"], lang_info["description"], d)
    
    #     Create a directory, web/locales/str/ and copy the two files cross-locale.ftl & messages.ftl from web/locales/en/ to web/locales/str/,
    try:
        os.mkdir("web/locales/"+lang_info["ISO"])
        print("web/locales/"+lang_info["ISO"]+" created")
    except:
        print("web/locales/"+lang_info["ISO"]+" already exists. Skipping.")

    #     cp web/locales/en/* web/locales/str/
    copyfile(lang_info["ISO"], "cross-locale.ftl")
    copyfile(lang_info["ISO"], "messages.ftl")
    

# helper functions
def add_iso_to_list(iso, filename, des=""):
    locales = json.load(open(filename, "r"))
    if iso not in locales:
        if not des:
            locales.append(iso)
            locales = sorted(locales)
        else:
            locales[iso] = des
            locales = dict(sorted(locales.items()))

        json.dump(locales,open(filename, "w"),indent=2, ensure_ascii=False)
        print("{} added to {}.".format(iso, filename))
    else:
        print("{} already in {}. Skipping.".format(iso, filename))


def copyfile(iso, filename):
    if not os.path.isfile("web/locales/{}/{}".format(iso,filename)):
        shutil.copyfile("web/locales/en/{}".format(filename),"web/locales/{}/{}".format(iso,filename))
        print("web/locales/{}/{} created and populated.".format(iso,filename))
    else:
        print("web/locales/{}/{} already created. Skipping.".format(iso,filename))


def update_message_file(iso, des, dir):
    with open("web/locales/{}/messages.ftl".format(dir), "r") as messages:
        messages = [m.rstrip() for m in messages.readlines()]

    i = -1
    toadd = "{} = {}".format(iso, des)
    while i < len(messages):
        i += 1
        if messages[i] == "## Languages":
            i += 1
            j = int(i)
            current_langs = []
            while messages[i] != "# [/]":
                current_langs.append(messages[i].strip())
                i+=1
            if toadd not in current_langs:
                messages.insert(j,toadd)
                open("web/locales/{}/messages.ftl".format(dir), "w").writelines(m+"\n" for m in messages) 
                print("{} added to web/locales/{}/messages.ftl.".format(iso, dir))
                
            else:
                print("{} already in web/locales/{}/messages.ftl. Skipping.".format(iso,dir))

            break

main()
