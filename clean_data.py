

def main():
    new_entries = []
    with open('data_unfocconf.csv') as file:
        headers = file.readline()
        headers = headers.replace("\n", "")
        headers += ',focused\n'
        new_entries.append(headers)
        # print("Headers:\n", headers)
        for line in file:    
            values = line.split(",")
            found_non_empty_values = False
            for value in values[1:-1]:
                if (value is not ""):
                    found_non_empty_values = True
            if found_non_empty_values:
                line = line.replace("\n", "")
                line += ',0\n'
                new_entries.append(line)
            # print("Next line")
        
    with open('cleaned_unfocusedconf.csv', 'w+') as new_file:
        header_line = True
        for entry in new_entries:
            if header_line:
                header_line = False
                new_file.write(entry)
            else:
                new_file.write(entry)



if __name__ == "__main__":
    main()
