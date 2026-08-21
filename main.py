import eel
import json
import random

# Tell eel which folder contains the project web files
eel.init('web')

# Load questions from json file
with open("Corinthians.json", "r", encoding="utf-8") as file:
    all_questions = json.load(file)

@eel.expose
def create_quizzes(quiz_settings):
    # Make a deep copy of all_questions and filter questions based on quizSettings
    group_questions = json.loads(json.dumps(all_questions))
    group_questions = filter_questions(group_questions, quiz_settings)

    # Loop to get desired number of quizzes
    quizzes = []
    quiz_num = 1
    while len(quizzes) < quiz_settings["numQuizzes"]:
        quiz = create_quiz(group_questions, quiz_settings, quiz_num)
        if quiz == "Error":
            return "Error creating quizzes."
        quizzes.append(quiz)
        quiz_num += 1

    # Check Final Quiz

    # Check Extra Questions

    # Output Quizzes to PDF & Return Success Message
    



# Keep questions that match quiz_settings
def filter_questions(group_questions, quiz_settings):
    # Generate all possible Type-Club combinations for comparing to questions
    # eg. ["INT-Club 50", "FTV-Club 100", "FTN-Club 100", ...]
    selectedTypesAndClubs = []
    for ques_type in quiz_settings["quesTypes"]:
        selectedTypesAndClubs += ques_type["typeClubCombos"]

    # Search for questions that meet quiz settings
    filtered = []
    for ques in group_questions:
        if ques_in_material(ques, quiz_settings["material"]) and ques["type_club"] in selectedTypesAndClubs:
            filtered.append(ques)

    return filtered
    
# Check if question is within any of the selected material
def ques_in_material(ques, material):
    for section in material:
        if ques_in_section(ques, section):
            return True      
    return False

# Check if question is within a specific chapter section
def ques_in_section(ques, section):
    return ques["book"] == section["book"] and ques["ch"] == section["ch"] and section["startVerse"] <= ques["vs"] <= section["endVerse"]
            

# Create and return a single quiz, return "Error" if can't make quiz
def create_quiz(group_questions, quiz_settings, quiz_num):
    # Check for enough possible questions
    if len(group_questions) < quiz_settings["numQuesInQuiz"]:
        return "Error"

    # Init Quiz Variable to store quiz title and questions
    quiz = {
        "title": f"Quiz #{quiz_num} - {quiz_settings['quizTitle']}",
        "questions": []
    }

    # Create copies of group_questions & quiz_settings so that they are fresh versions for the current quiz
    quiz_questions = json.loads(json.dumps(group_questions)) #deep copy
    quiz_settings = json.loads(json.dumps(quiz_settings)) #deep copy

    # Order selected question types so that types in shortest supply and/or greatest demand are placed first.
    quiz_settings["ques_types"] = set_type_order(quiz_settings["ques_types"], quiz_questions)
    if quiz_settings["ques_types"] == "Error":
        return "Error"

    # Get Questions to Fulfill Minimums of each Question Type
    for ques_type in quiz_settings["quesTypes"]:
        # Assign type_club_combos to select a question from
        type_club_combos = ques_type["typeClubCombos"]

        # Consider "ref": more specific type_club_combos to ensure at least one of each of ch reference and ch-vs reference
        if ques_type["type"] == "ref":
            if not quiz_settings["vsRefIncluded"]:
                type_club_combos = ques_type["vsTypeClubCombos"]
                quiz_settings["vsRefIncluded"] = True # Assume a question will be found. If not program will exit.
            elif not quiz_settings["chRefIncluded"]:
                type_club_combos = ques_type["chTypeClubCombos"]
                quiz_settings["chRefIncluded"] = True # Assume a question will be found. If not program will exit.
        
        # Get the minimum number of questions for the current type
        for _ in range(ques_type["min"]):
            question = get_question(ques_type, type_club_combos, quiz_questions, group_questions, quiz_settings)
            if question == "Error":
                return "Error"
            quiz["questions"].append(question)
            processFoundQuestion(question, quiz_questions, group_questions, quiz_settings)

        # Randomly Select Remaining Required Questions   


# Set the order of questions types so that the question types in shortest supply and/or greatest demand are selected first. Use calculation: # available / min required
def set_type_order(ques_types, quiz_questions):
    # Count # of questions available for each question type
    for ques in quiz_questions:
        for ques_type in ques_types:
            if ques["type_club"] in ques_type["typeClubCombos"]:
                ques_type["quesAvailable"] += 1
    
    # Calculate order precedence for each question type, as long as enough questions are available
    for ques_type in ques_types:
        if ques_type["quesAvailable"] < ques_type["min"]:
           return "Error"
        ques_type["order"] = ques_type["quesAvailable"] / ques_type["min"]

    # Sort Question Types by "order" property (ascending)
    return sorted(ques_types, key=lambda x: x["order"])

# Get a question of the provided question type
def get_question(ques_type, type_club_combos, quiz_questions, group_questions, quiz_settings):
    # Shuffle and then sort material list by count to look for questions starting from the least used material
    quiz_settings["material"] = shuffle_sort_by_count(quiz_settings["material"])

    # Search material for a question of the provided question type
    for section in quiz_settings["material"]:
        # Find all questions that match current section and provided type_club_combos for current question type
        matched_questions = []
        for ques in quiz_questions:
            if ques_in_section(ques, section) and ques["type_club"] in type_club_combos:
                matched_questions.append(ques)

        # If matching results found, return question. Otherwise, move onto next section
        if len(matched_questions) != 0:
            # Shuffle and then sort matched_questions to randomly select a question with the lowest count
            matched_questions = shuffle_sort_by_count(matched_questions)
            return matched_questions[0]



            

        

        


# Shuffle material and then sort by count
def shuffle_sort_by_count(a_list):
    random.shuffle(a_list)
    return sorted(a_list, key = lambda x: x["count"])


# Take action to make appropriate modifications based on found question and quiz settings
def processFoundQuestion(question, quiz_questions, group_questions, quiz_settings):
    pass




# Start the application, opening index.html in a local browser window
eel.start('index.html', size=(800, 600))