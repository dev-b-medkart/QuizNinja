const validateQuestion = (question) => {
	const {
		question_text,
		subject_code,
		reference_book_or_source,
		image_url,
		options,
		correct_option_ids,
		difficulty,
		chapter,
	} = question;

	// Trim individual fields
	const trimmedQuestion = question_text?.trim();
	const trimmedSubjectCode = subject_code?.trim();
	const trimmedChapter = chapter?.trim() ?? null;
	const trimmedSource = reference_book_or_source?.trim() ?? null;
	const trimmedImageUrl = image_url?.trim() ?? null;

	if (!trimmedQuestion) {
		return { error: "Question text is required." };
	}

	if (!trimmedSubjectCode) {
		return { error: "Subject code is required." };
	}

	if (!options || !Array.isArray(options) || options.length < 2) {
		return { error: "At least two options are required." };
	}

	// Convert each option to a trimmed string, allowing numbers
	const trimmedOptions = options.map((opt) => {
		if (opt === null || opt === undefined) {
			return "";
		}
		if (typeof opt === "string") {
			return opt.trim();
		}
		// For numbers (or other types), convert to string first
		return String(opt).trim();
	});

	// Check that no option is empty after trimming
	if (trimmedOptions.some((opt) => !opt)) {
		return { error: "Each option must have non-empty text." };
	}

	if (!correct_option_ids || correct_option_ids.length === 0) {
		return { error: "At least one correct option is required." };
	}

	// Ensure all correct_option_ids are within the range of trimmedOptions
	const invalidOptionIds = correct_option_ids.some(
		(id) => id < 0 || id >= trimmedOptions.length
	);
	if (invalidOptionIds) {
		return {
			error: `Correct option IDs must be between 0 and ${
				trimmedOptions.length - 1
			}.`,
		};
	}

	// Ensure correct_option_ids are unique
	const uniqueOptionIds = new Set(correct_option_ids);
	if (uniqueOptionIds.size !== correct_option_ids.length) {
		return { error: "Correct option IDs must be unique." };
	}

	if (!difficulty || difficulty < 1 || difficulty > 5) {
		return { error: "Difficulty must be between 1 and 5." };
	}

	// Validate chapter (if provided, it must not be empty after trimming)
	if (chapter !== undefined && chapter !== null && !trimmedChapter) {
		return { error: "Chapter cannot be empty if provided." };
	}

	// Return a clean object with only the trimmed values
	return {
		validatedData: {
			question: trimmedQuestion,
			subject_code: trimmedSubjectCode,
			reference_book_or_source: trimmedSource,
			image_url: trimmedImageUrl,
			options: trimmedOptions,
			correct_option_ids,
			difficulty,
			chapter: trimmedChapter,
		},
	};
};
