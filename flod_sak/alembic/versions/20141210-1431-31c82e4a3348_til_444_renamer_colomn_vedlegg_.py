"""TIL-444 renamer colomn Vedlegg.saksbehandler_id til Vedlegg.user_id

Revision ID: 31c82e4a3348
Revises: 2eddfabcc45d
Create Date: 2014-12-10 14:31:55.901292

"""

# revision identifiers, used by Alembic.
revision = '31c82e4a3348'
down_revision = '2eddfabcc45d'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.alter_column('vedlegg',
                    'saksbehandler_id',
                    new_column_name='user_id',
                    nullable=False)
    op.alter_column('vedlegg', 'vedlagtdato',
                    type_=sa.DateTime(),
                    nullable=False)


def downgrade():
    op.alter_column('vedlegg', 'vedlagtdato',
                    type_=sa.DATE(),
                    nullable=True)
    op.alter_column('vedlegg',
                    'user_id',
                    new_column_name='saksbehandler_id',
                    nullable=True)
