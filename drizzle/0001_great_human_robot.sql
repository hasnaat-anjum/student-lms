CREATE TABLE `attendanceRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentUserId` int NOT NULL,
	`courseCode` varchar(32) NOT NULL,
	`recordedOn` date NOT NULL,
	`status` enum('present','absent','leave') NOT NULL,
	`markedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attendanceRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feePayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentUserId` int NOT NULL,
	`amountPkr` int NOT NULL,
	`status` enum('initiated','pending_verification','paid','failed','cancelled') NOT NULL DEFAULT 'initiated',
	`paymentProvider` varchar(32) NOT NULL,
	`paidAt` timestamp,
	`invoiceMonth` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feePayments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `attendance_recorded_on_idx` ON `attendanceRecords` (`recordedOn`);--> statement-breakpoint
CREATE INDEX `attendance_student_idx` ON `attendanceRecords` (`studentUserId`);--> statement-breakpoint
CREATE INDEX `fee_payments_paid_at_idx` ON `feePayments` (`paidAt`);--> statement-breakpoint
CREATE INDEX `fee_payments_student_idx` ON `feePayments` (`studentUserId`);